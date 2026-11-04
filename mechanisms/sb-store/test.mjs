// sb-store: what holds for any settings (invariance tests), then the subjects that shaped it (regression tests).
// Plain assertions, no libraries.

import { createRequire } from 'node:module';

const SbStore = createRequire(import.meta.url)('./sb-store.js');

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { console.log(`✗ ${name} — ${err.message}`); process.exitCode = 1; }
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };

// For arithmetic identities. Amounts here stay in the thousands, where rounding is around 1e-12,
// so 1e-9 passes any rounding error and fails any real slip.
const TOLERANCE = 1e-9;
const near = (actual, expected, what) => assert(Math.abs(actual - expected) <= TOLERANCE, `${what}: expected ${expected}, got ${actual}`);

function equal(result, expected) {
  for (const [key, value] of Object.entries(expected)) near(key === 'level' ? result.state.level : result[key], value, key);
}

// ---- Seeded random configurations and sequences ----

// mulberry32: small, and good enough to vary a test.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (random, low, high) => low + (high - low) * random();
const pick = (random, list) => list[Math.floor(random() * list.length)];

// Mixes both policies, infinite capacities and negative floors.
function randomSettings(random, policies = {}) {
  const capacity = random() < 0.2 ? Infinity : between(random, 1, 1000);
  const floor = random() < 0.5 ? 0 : -between(random, 0, 500);
  const top = capacity === Infinity ? 1000 : capacity;
  return {
    capacity,
    floor,
    level: pick(random, [floor, top, between(random, floor, top)]),
    overflow: pick(random, SbStore.POLICIES.overflow),
    shortfall: pick(random, SbStore.POLICIES.shortfall),
    ...policies
  };
}

// Mostly any amount, but often exactly zero, exactly the room or exactly what's there: the edges.
function randomAmount(random, state) {
  const edges = [0, state.capacity - state.level, state.level - state.floor].filter(Number.isFinite);
  return random() < 0.3 ? pick(random, edges) : between(random, 0, 600);
}

function randomOperation(random, state) {
  return { name: pick(random, ['fill', 'take', 'step']), inflow: randomAmount(random, state), outflow: randomAmount(random, state) };
}

function apply(state, { name, inflow, outflow }) {
  if (name === 'fill') return SbStore.fill(state, inflow);
  if (name === 'take') return SbStore.take(state, outflow);
  return SbStore.step(state, inflow, outflow);
}

const CONFIGURATIONS = 150;
const SEQUENCE = 30;

// Runs `check(result, operation, before)` over every step of many random runs.
function overRandomRuns(check, policies) {
  for (let seed = 1; seed <= CONFIGURATIONS; seed++) {
    const random = seeded(seed);
    let state = SbStore.create(randomSettings(random, policies));
    for (let i = 0; i < SEQUENCE; i++) {
      const operation = randomOperation(random, state);
      const result = apply(state, operation);
      check(result, operation, state);
      state = result.state;
    }
  }
}

const offered = ({ name, inflow }) => (name === 'take' ? 0 : inflow);
const asked = ({ name, outflow }) => (name === 'fill' ? 0 : outflow);

// JSON turns Infinity into null, which would hide a capacity changing to or from it.
const show = (value) => JSON.stringify(value, (_, x) => (x === Infinity ? 'Infinity' : x));

// ---- Invariance tests ----

test('conservation: every amount is accounted for, and the level moves by exactly added − supplied', () => {
  overRandomRuns(({ state, added = 0, spilled = 0, rejected = 0, supplied = 0, short = 0 }, operation, before) => {
    near(added + spilled + rejected, offered(operation), 'what was offered');
    near(supplied + short, asked(operation), 'what was asked');
    near(state.level, before.level + added - supplied, 'the level');
  });
});

test('bounds: floor ≤ level ≤ capacity after any sequence, exactly', () => {
  overRandomRuns(({ state }) => assert(state.floor <= state.level && state.level <= state.capacity, `level ${state.level} outside ${state.floor} to ${state.capacity}`));
});

test('a fill or step reaching the top leaves the level exactly at the capacity, and a take to the bottom exactly at the floor', () => {
  // Numbers found by search, whose sums round past or short of the bound if the arithmetic is trusted.
  const nearlyTop = { capacity: 9.589, level: 0.242 };    // 0.242 + (9.589 − 0.242) is 9.589000000000002
  assert(SbStore.fill(SbStore.create(nearlyTop), 100).state.level === 9.589, 'fill past the top');
  assert(SbStore.step(SbStore.create(nearlyTop), 100, 0).state.level === 9.589, 'step past the top');

  const fallsShort = { capacity: 7.197, level: 1.113 };   // 1.113 + (7.197 − 1.113) is 7.196999999999999
  assert(SbStore.fill(SbStore.create(fallsShort), 100).state.level === 7.197, 'fill past the top, rounding short of it');

  const justFits = { capacity: 3.905, level: 1.769 };     // 1.769 + 2.136 is 3.9050000000000002
  assert(SbStore.fill(SbStore.create(justFits), 2.136).state.level === 3.905, 'fill exactly to the top');
  assert(SbStore.step(SbStore.create(justFits), 2.136, 0).state.level === 3.905, 'step exactly to the top');

  const nearlyEmpty = { floor: -7.079, level: 1.977 };    // 1.977 − (1.977 + 7.079) is -7.078999999999999
  assert(SbStore.take(SbStore.create(nearlyEmpty), 100).state.level === -7.079, 'take past the floor');
  assert(SbStore.step(SbStore.create(nearlyEmpty), 0, 100).state.level === -7.079, 'step past the floor');

  const justEmpties = { floor: -0.602, level: 6.242 };    // 6.242 − 6.844 is -0.6020000000000003
  assert(SbStore.take(SbStore.create(justEmpties), 6.844).state.level === -0.602, 'take exactly to the floor');
});

test('reject is all-or-nothing: added is 0 or the whole amount, and supplied likewise', () => {
  overRandomRuns((result, operation) => {
    const { added, supplied, spilled = 0 } = result;
    if (added !== undefined) assert(added === 0 || added === offered(operation), `added ${added} of ${offered(operation)}`);
    assert(spilled === 0, `spilled ${spilled} under reject`);
    if (supplied !== undefined) assert(supplied === 0 || supplied === asked(operation), `supplied ${supplied} of ${asked(operation)}`);
  }, { overflow: 'reject', shortfall: 'reject' });
});

test('purity: no operation changes the state it is given', () => {
  overRandomRuns((_, operation, before) => {
    const snapshot = show(before);
    apply(before, operation);
    SbStore.lasts(before, 1);
    assert(show(before) === snapshot, 'the state changed');
  });
});

test('determinism: the same inputs give the same outputs', () => {
  overRandomRuns((result, operation, before) => assert(show(apply(before, operation)) === show(result), 'a second run differed'));
});

test('unit scaling: multiplying every setting and amount by 4 multiplies every output by 4', () => {
  const SCALE = 4; // A power of two, so floating point stays exact and the comparison can be too.
  const scaled = (x) => x * SCALE;
  for (let seed = 1; seed <= CONFIGURATIONS; seed++) {
    const random = seeded(seed);
    const settings = randomSettings(random);
    let plain = SbStore.create(settings);
    let large = SbStore.create({ ...settings, capacity: scaled(settings.capacity), floor: scaled(settings.floor), level: scaled(settings.level) });
    for (let i = 0; i < SEQUENCE; i++) {
      const operation = randomOperation(random, plain);
      const a = apply(plain, operation);
      const b = apply(large, { ...operation, inflow: scaled(operation.inflow), outflow: scaled(operation.outflow) });
      for (const key of ['added', 'spilled', 'rejected', 'supplied', 'short']) {
        if (key in a) assert(b[key] === scaled(a[key]), `${key}: ${b[key]} is not 4 × ${a[key]}`);
      }
      assert(b.state.level === scaled(a.state.level), `level: ${b.state.level} is not 4 × ${a.state.level}`);
      plain = a.state;
      large = b.state;
    }
  }
});

// This law holds for a single store, not across networks of them: there, more capacity can make
// things worse (Braess's paradox; Belady's anomaly in caches).
test('capacity, for one store: under spill and partial, a larger capacity never spills more or supplies less', () => {
  for (let seed = 1; seed <= CONFIGURATIONS; seed++) {
    const random = seeded(seed);
    const capacity = between(random, 10, 500);
    const level = between(random, 0, capacity);
    let small = SbStore.create({ capacity, level });
    let large = SbStore.create({ capacity: capacity + between(random, 0, 300), level });
    const totals = { small: { spilled: 0, supplied: 0 }, large: { spilled: 0, supplied: 0 } };
    for (let i = 0; i < SEQUENCE; i++) {
      const operation = randomOperation(random, small);
      const a = apply(small, operation);
      const b = apply(large, operation);
      totals.small.spilled += a.spilled || 0;
      totals.small.supplied += a.supplied || 0;
      totals.large.spilled += b.spilled || 0;
      totals.large.supplied += b.supplied || 0;
      small = a.state;
      large = b.state;
    }
    assert(totals.large.spilled <= totals.small.spilled + TOLERANCE, `larger spilled more: ${totals.large.spilled} > ${totals.small.spilled}`);
    assert(totals.large.supplied >= totals.small.supplied - TOLERANCE, `larger supplied less: ${totals.large.supplied} < ${totals.small.supplied}`);
  }
});

test('in before out: step never spills more, or supplies less, than fill followed by take with the same amounts', () => {
  overRandomRuns((_, { inflow, outflow }, before) => {
    const together = SbStore.step(before, inflow, outflow);
    const filled = SbStore.fill(before, inflow);
    const taken = SbStore.take(filled.state, outflow);
    assert(together.spilled <= filled.spilled + TOLERANCE, `step spilled ${together.spilled}, fill then take ${filled.spilled}`);
    assert(together.supplied >= taken.supplied - TOLERANCE, `step supplied ${together.supplied}, fill then take ${taken.supplied}`);
  });
});

test('lasts: lasts(state, r) × r equals level − floor for any positive rate, and it is Infinity when not draining', () => {
  overRandomRuns((_, __, before) => {
    const random = seeded(before.level * 1000);
    const rate = between(random, 0.01, 50);
    near(SbStore.lasts(before, rate) * rate, before.level - before.floor, 'lasts × rate');
    assert(SbStore.lasts(before, 0) === Infinity, 'a rate of zero');
    assert(SbStore.lasts(before, -rate) === Infinity, 'a net inflow');
  });
});

test('the exported invariants hold over random runs', () => {
  overRandomRuns((result, operation, before) => {
    assert(SbStore.invariants.withinBounds(result.state), 'withinBounds');
    assert(SbStore.invariants.accounted(result, { before, inflow: offered(operation), outflow: asked(operation) }), 'accounted');
  });
});

test('the exported invariants catch a result that breaks them, in any unit', () => {
  const before = SbStore.create({ capacity: 1e12, level: 3e11 });
  const good = SbStore.step(before, 7e10, 2e10);
  const amounts = { before, inflow: 7e10, outflow: 2e10 };
  assert(SbStore.invariants.accounted(good, amounts), 'a good result at large numbers');
  assert(!SbStore.invariants.accounted({ ...good, spilled: 5e9 }, amounts), 'an amount unaccounted for');
  assert(!SbStore.invariants.accounted({ ...good, short: 5e9 }, amounts), 'a demand unaccounted for');
  assert(!SbStore.invariants.accounted({ ...good, state: { ...good.state, level: good.state.level + 5e9 } }, amounts), 'a level moved by the wrong amount');
  assert(!SbStore.invariants.withinBounds({ ...before, level: 2e12 }), 'above the capacity');
  assert(!SbStore.invariants.withinBounds({ ...before, level: -1 }), 'below the floor');
});

const THROWS = [
  ['a floor above the capacity', () => SbStore.create({ floor: 10, capacity: 5 }), /lower the floor/],
  ['a level above the capacity', () => SbStore.create({ capacity: 5, level: 6 }), /outside/],
  ['a level below the floor', () => SbStore.create({ level: -1 }), /outside/],
  ['a non-numeric level', () => SbStore.create({ level: 'full' }), /level must be/],
  ['an infinite level', () => SbStore.create({ level: Infinity }), /level must be/],
  ['a capacity of no number', () => SbStore.create({ capacity: NaN }), /capacity must be/],
  ['a capacity in words', () => SbStore.create({ capacity: 'big' }), /capacity must be/],
  ['a floor of minus infinity', () => SbStore.create({ floor: -Infinity }), /unlimited source/],
  ['a floor of no number', () => SbStore.create({ floor: NaN }), /unlimited source/],
  ['an unknown overflow', () => SbStore.create({ overflow: 'drain' }), /unknown overflow 'drain'.*spill, reject/],
  ['an unknown shortfall', () => SbStore.create({ shortfall: 'borrow' }), /unknown shortfall 'borrow'.*partial, reject/],
  ['a negative fill', () => SbStore.fill(SbStore.create(), -1), /SbStore\.take/],
  ['a fill in words', () => SbStore.fill(SbStore.create(), '5'), /amount must be/],
  ['a fill of no number', () => SbStore.fill(SbStore.create(), NaN), /amount must be/],
  ['an infinite fill', () => SbStore.fill(SbStore.create(), Infinity), /amount must be/],
  ['a missing fill', () => SbStore.fill(SbStore.create()), /amount must be/],
  ['a negative take', () => SbStore.take(SbStore.create(), -1), /SbStore\.fill/],
  ['a take in words', () => SbStore.take(SbStore.create(), '5'), /amount must be/],
  ['an infinite take', () => SbStore.take(SbStore.create(), Infinity), /amount must be/],
  ['a negative inflow', () => SbStore.step(SbStore.create(), -1, 0), /inflow must be.*pass it as outflow/],
  ['a negative outflow', () => SbStore.step(SbStore.create(), 0, -1), /outflow must be.*pass it as inflow/],
  ['an inflow in words', () => SbStore.step(SbStore.create(), '1', 0), /inflow must be/],
  ['a missing outflow', () => SbStore.step(SbStore.create(), 1), /outflow must be/],
  ['a rate of no number', () => SbStore.lasts(SbStore.create(), NaN), /netOutRate must be/],
  ['an infinite rate', () => SbStore.lasts(SbStore.create(), Infinity), /netOutRate must be/]
];

for (const [what, call, says] of THROWS) {
  test(`errors: ${what} throws, saying what to do instead`, () => {
    let message;
    try { call(); } catch (err) { message = err.message; }
    assert(message, 'it did not throw');
    assert(says.test(message), `it said: ${message}`);
  });
}

test('settings: an infinite capacity is allowed, and an unset level starts at 0, brought within the floor and capacity', () => {
  assert(SbStore.create().capacity === Infinity, 'no ceiling by default');
  assert(SbStore.create().level === 0, 'starts at 0');
  assert(SbStore.create({ floor: 5, capacity: 10 }).level === 5, 'raised to the floor');
  assert(SbStore.create({ floor: -10, capacity: -5 }).level === -5, 'lowered to the capacity');
});

// ---- Regression tests ----
// Each is the story of a subject. A comment names what that subject pulled on the store, and in which
// version, so these and the changelog tell the same history. When a later subject pulls the store to
// change, its story records the new policy and version, and every older story must still pass.

// Pull (0.1.0): step, in before out, and lasts.
// Figures from the household and neighbourhood resilience sandbox's catalogued sources: SRC-1, the UK's
// Be Ready page, "3 litres per person per day for drinking", for 3 days; SRC-15, Ofwat, companies "must
// provide at least 10 litres of water per person per day to affected consumers within the first 24 hours".
test('water: a household stockpile lasts 2.5 days alone, and stops falling once emergency supply arrives', () => {
  const people = 4;
  const dailyNeed = people * 3;                           // 12 L a day
  const emergencySupply = people * 10;                    // 40 L a day
  assert(dailyNeed * 3 === 36, 'guidance is 36 L for a household of four over 3 days');

  const stockpile = SbStore.create({ capacity: 30, level: 30 }); // the household's containers
  near(SbStore.lasts(stockpile, dailyNeed), 30 / 12, 'days it lasts alone');

  const dayOne = SbStore.take(stockpile, dailyNeed);      // no emergency supply yet
  equal(dayOne, { level: 30 - 12, supplied: 12, short: 0 });

  const dayTwo = SbStore.step(dayOne.state, emergencySupply, dailyNeed);
  equal(dayTwo, { level: 30, supplied: 12, short: 0, added: 30 - 18 + 12, spilled: 18 + 40 - 12 - 30 });

  const dayThree = SbStore.step(dayTwo.state, emergencySupply, dailyNeed);
  equal(dayThree, { level: 30, supplied: 12, short: 0, added: 12, spilled: 40 - 12 });
});

// Pull (0.1.0): step, in before out, and lasts.
test('hydrology: a rainwater tank spills in a storm, lasts 13.3 days, runs short over 16, and meets demand from the same day\'s rain', () => {
  const tank = SbStore.create({ capacity: 2000, level: 300 });
  const storm = SbStore.fill(tank, 2500);
  equal(storm, { added: 2000 - 300, spilled: 300 + 2500 - 2000, rejected: 0, level: 2000 });

  near(SbStore.lasts(storm.state, 150), 2000 / 150, 'days it lasts at 150 L a day');

  let state = storm.state;
  let short = 0;
  for (let day = 0; day < 16; day++) {
    const today = SbStore.take(state, 150);
    state = today.state;
    short += today.short;
  }
  near(short, 16 * 150 - 2000, 'short over 16 days');
  near(state.level, 0, 'left dry');

  // 100 L of rain and 150 L of demand on a nearly full tank: in before out, none of it is lost.
  const nearlyFull = SbStore.create({ capacity: 2000, level: 1950 });
  equal(SbStore.step(nearlyFull, 100, 150), { level: 1950 + 100 - 150, spilled: 0, supplied: 150 });
  const filled = SbStore.fill(nearlyFull, 100);
  equal(filled, { spilled: 50 });
  equal(SbStore.take(filled.state, 150), { level: 2000 - 150 });
});

// Pull (0.1.0): spill as a meaningful output, export, not just loss.
test('energy: a home battery exports 6.5 kWh of solar surplus, then imports 2.5 kWh in the evening', () => {
  let battery = SbStore.create({ capacity: 13.5, level: 2 });
  let exported = 0;
  for (let hour = 0; hour < 6; hour++) {
    const surplus = SbStore.fill(battery, 3);
    battery = surplus.state;
    exported += surplus.spilled;
  }
  near(battery.level, 13.5, 'full');
  near(exported, 2 + 6 * 3 - 13.5, 'exported');

  let imported = 0;
  for (let hour = 0; hour < 5; hour++) {
    const evening = SbStore.take(battery, 3.2);
    battery = evening.state;
    imported += evening.short;
  }
  near(imported, 5 * 3.2 - 13.5, 'imported');
});

// Pull (0.1.0): the negative floor, and shortfall: reject.
test('finance: a bank account with an overdraft declines a £600 payment whole, and pays £400 into the overdraft', () => {
  const account = SbStore.create({ floor: -500, level: 50, shortfall: 'reject' });
  near(account.level - account.floor, 550, 'available');
  equal(SbStore.take(account, 600), { supplied: 0, short: 600, level: 50 });
  equal(SbStore.take(account, 400), { supplied: 400, short: 0, level: 50 - 400 });
});

// Pull (0.1.0): overflow: reject.
// The level is the seats taken: a booking is a fill, and guests leaving are a take.
test('hospitality: venue seating refuses a booking of 6 whole when 4 seats are free, and takes it once guests leave', () => {
  const seats = SbStore.create({ capacity: 40, level: 36, overflow: 'reject', shortfall: 'reject' });
  const refused = SbStore.fill(seats, 6);
  equal(refused, { added: 0, spilled: 0, rejected: 6, level: 36 });

  const left = SbStore.take(seats, 2);
  equal(left, { supplied: 2, level: 34 });
  equal(SbStore.fill(left.state, 6), { added: 6, rejected: 0, level: 40 });
});

// ---- What the store refuses ----

// Expiry and first-in-first-out belong to the ageing stock, still to come.
test('refusal: food with best-before dates is not a store, which has no notion of which units are older', () => {
  const inTwoDeliveries = SbStore.fill(SbStore.fill(SbStore.create({ capacity: 20 }), 6).state, 6).state;
  const inOneDelivery = SbStore.fill(SbStore.create({ capacity: 20 }), 12).state;
  assert(show(inTwoDeliveries) === show(inOneDelivery), 'two deliveries should leave no trace of which came first');
  assert(Object.keys(inOneDelivery).sort().join() === 'capacity,floor,level,overflow,shortfall', 'the state holds nothing about batches');
});

// Fair sharing is allocation's job, still to come. Taking one request at a time can't double-spend, but order decides.
test('refusal: two households drawing on one water point in the same step are not treated fairly, since the first takes what it can', () => {
  const waterPoint = SbStore.create({ level: 10 });

  const firstAsks = SbStore.take(waterPoint, 8);
  const secondAsks = SbStore.take(firstAsks.state, 8);
  equal(firstAsks, { supplied: 8 });
  equal(secondAsks, { supplied: 2, short: 6, level: 0 });
  near(firstAsks.supplied + secondAsks.supplied, 10, 'never more than there was');

  const secondFirst = SbStore.take(waterPoint, 3);
  const firstSecond = SbStore.take(secondFirst.state, 8);
  equal(firstSecond, { supplied: 7, short: 1 });
});
