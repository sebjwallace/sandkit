# sb-store

A level between a floor and a ceiling, filled and taken from: it overflows when full and runs short when empty. A **stock**: the model keeps its state between steps. It's the mechanism under a rainwater tank, a home battery, a bank account, a water stockpile and venue seating.

Use this mechanism through the interface below; you don't need to read its source. See the mechanisms practice for how to compose it.

## Units

Every setting, amount and output is in one quantity, **Q**, of the model's choosing: litres, kWh, pounds, people. The store has no clock: turn rates into amounts (rate × step length) before calling it. `lasts` is the one place time appears.

## Settings

`SbStore.create({ capacity, floor, level, overflow, shortfall })` returns the state, a plain object holding all five. All are optional.

| Setting | Unit | Default | Meaning |
|---|---|---|---|
| `capacity` | Q | `Infinity` | The ceiling. |
| `floor` | Q | `0` | The lowest the level can go, and finite. Negative for an overdraft; positive for a reserve never drawn. |
| `level` | Q | `0`, brought within floor and capacity | Where it starts. **A store starts empty unless told otherwise:** a stockpile written as `create({ capacity: stored })` holds nothing, with no error. Give it `level: stored` too. |
| `overflow` | policy | `'spill'` | More arriving than there's room for. `spill`: keep what fits, and report the rest as spilled. `reject`: refuse all of it, leaving it with whoever offered it. |
| `shortfall` | policy | `'partial'` | More demanded than is available. `partial`: supply what's there, and report the rest as short. `reject`: supply nothing unless the whole amount is available. |

`SbStore.POLICIES` lists the policies.

## Operations

Each takes the state first and never changes it. Amounts are finite and zero or more, in Q.

| Operation | Returns |
|---|---|
| `SbStore.fill(state, amount)` | `{ state, added, spilled, rejected }`, which sum to `amount`. |
| `SbStore.take(state, amount)` | `{ state, supplied, short }`, which sum to `amount`. |
| `SbStore.step(state, inflow, outflow)` | `{ state, added, spilled, rejected, supplied, short }`: everything that happens in one model step. |
| `SbStore.lasts(state, netOutRate)` | Time until the floor at that rate, in Q per unit of time, so the result is in that unit of time. `Infinity` if the rate is zero or less. |

**Amounts are exactly zero when nothing happened,** so testing `spilled > 0` or `short > 0` is safe. Otherwise they're accurate to rounding (relative 1e-9), so compare them with a tolerance, not `===`. A level that reaches its floor or capacity sits exactly on it.

**The order within `step` is in before out:**

1. The inflow joins the level.
2. The outflow is supplied from that pool, by the shortfall policy.
3. What remains above the capacity is spilled, under `spill`.

Under overflow `reject`, the inflow is refused whole if what remains would still exceed the capacity, and the outflow is then supplied from the original level. For out before in, call `take` then `fill`.

**Invalid input throws,** with a message saying what to do instead: an amount that's negative, non-numeric or infinite; a floor above the capacity or not finite (an unlimited source doesn't need a store, so treat it as a plain number in the model); a starting level outside the floor and capacity; an unknown policy.

## Invariants

Plain functions for a sandbox's model tests, returning true or false:

- `SbStore.invariants.withinBounds(state)`: `floor ≤ level ≤ capacity`.
- `SbStore.invariants.accounted(result, { before, inflow, outflow })`: every amount is accounted for, and the level moved by exactly `added − supplied`. `before` is the state the operation was given; `inflow` is what `fill` or `step` was offered, and `outflow` what `take` or `step` was asked for.

## Where it stops

- **No expiry or batches.** It has no notion of which units are older. That's an ageing stock.
- **No losses over time.** Leakage, evaporation, self-discharge and interest are proportional change, composed alongside it.
- **No deciding between claimants.** Requests taken one at a time can't double-spend, but order decides who gets what. When it shouldn't, that's allocation.
- **No ranges.** A model working in low and high estimates runs a store for each, as the last example shows.

## Examples

A rainwater tank fed by a roof and drawn on daily:

```js
function day(state, rainfall) {
  const caught = rainfall * state.roofArea * state.runoffShare;   // mm × m² gives litres
  const today = SbStore.step(state.tank, caught, state.dailyUse);
  return { ...state, tank: today.state, overflowed: state.overflowed + today.spilled, unmet: state.unmet + today.short };
}

const start = { tank: SbStore.create({ capacity: 2000, level: 300 }), roofArea: 80, runoffShare: 0.8, dailyUse: 150, overflowed: 0, unmet: 0 };
SbStore.lasts(start.tank, start.dailyUse);   // 2 days, with no rain
```

A stockpile that starts full, since `level` defaults to 0:

```js
const stockpile = SbStore.create({ capacity: 60, level: 60 });
SbStore.lasts(stockpile, 20);   // 3 days
```

Running across a range, pairing the ends by the outcome they produce: the pessimistic run takes the least arriving with the heaviest use, not the low end of each. See "Ranges" in the mechanisms practice.

```js
function unmetOverAWeek(arriving, used) {
  let tank = SbStore.create({ capacity: 60, level: 60 });
  let unmet = 0;
  for (let day = 0; day < 7; day++) {
    const today = SbStore.step(tank, arriving, used);
    tank = today.state;
    unmet += today.short;
  }
  return unmet;
}

const pessimistic = unmetOverAWeek(5, 20);    // 45 litres: it runs dry on day 5
const optimistic = unmetOverAWeek(10, 15);    // 0 litres
```
