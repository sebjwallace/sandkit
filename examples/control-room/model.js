// The control room model: how the grid's frequency falls when its largest unit trips, and what
// catches it. No UI here. The page reads `state`, calls `step()` and `reset()`, and sets options.
//
// The codes below are this sandbox's: PAR parameter, RUL rule, ASM assumption, REQ what operators
// asked for, SCR a part of the new screen, QST an open question. Every one is traceable to the
// sources it rests on (`ITEMS`), as Sandkit's sources practice describes.

// Everything a person might trace, citing the passages it rests on.
const ITEMS = [
  // The standard's numbers.
  { id: 'PAR-1', title: 'Fast response: full within 2 s', kind: 'Parameter',
    sources: [{ source: 'SRC-2', quote: 'Fast frequency response must reach its full output within 2 seconds' }, { source: 'SRC-1', quote: 'Within two seconds the fast frequency response kicks in from batteries' }] },
  { id: 'PAR-2', title: 'Demand disconnection: 48.8 Hz', kind: 'Parameter',
    sources: [{ source: 'SRC-2', quote: 'Low frequency demand disconnection begins at 48.8 Hz' }, { source: 'SRC-1', quote: 'falls below 49.2 Hz' }] },
  { id: 'PAR-3', title: 'Largest loss: 1,320 MW', kind: 'Parameter',
    sources: [{ source: 'SRC-2', quote: 'that is 1,320 MW, the largest unit connected' }] },
  { id: 'PAR-4', title: 'Statutory limit: 49.5 Hz', kind: 'Parameter',
    sources: [{ source: 'SRC-2', quote: 'frequency must not fall below 49.5 Hz, the statutory limit' }] },

  // How the grid behaves.
  { id: 'RUL-1', title: 'Inertia slows the fall', kind: 'Rule',
    sources: [{ source: 'SRC-1', quote: 'Inertia from everything still spinning slows the fall' }] },
  { id: 'RUL-2', title: 'Batteries respond first', kind: 'Rule',
    sources: [{ source: 'SRC-1', quote: 'the batteries matter much more than they did' }], restsOn: ['PAR-1'] },
  { id: 'RUL-3', title: 'Demand is disconnected below the floor', kind: 'Rule',
    sources: [{ source: 'SRC-1', quote: 'low frequency demand disconnection takes blocks of demand off automatically' }], restsOn: ['PAR-2'] },
  { id: 'RUL-4', title: 'Hold response for the largest loss', kind: 'Rule',
    sources: [{ source: 'SRC-2', quote: 'Enough response is held at all times to cover the largest single infeed loss' }], restsOn: ['PAR-3'] },
  { id: 'ASM-1', title: 'Falls are faster on windy nights', kind: 'Assumption',
    sources: [{ source: 'SRC-5', quote: 'Falls are faster on windy nights', note: 'Taken as twice as fast: the analysis says "roughly", from six trips.' }], restsOn: ['RUL-1'] },

  // What operators asked of the new screen.
  { id: 'REQ-1', title: 'See how fast it is falling', kind: 'Requirement',
    sources: [{ source: 'SRC-4', quote: 'show how fast the frequency is falling, next to the frequency itself' }, { source: 'SRC-1', quote: 'the number I want is how fast it\'s falling' }], restsOn: ['RUL-1'] },
  { id: 'REQ-2', title: 'One click to book extra response', kind: 'Requirement',
    sources: [{ source: 'SRC-4', quote: 'Operators asked for one click to book extra response from the warning itself' }, { source: 'SRC-2', quote: 'The control room may book additional fast response ahead of time' }], restsOn: ['ASM-1', 'RUL-2', 'REQ-3'] },
  { id: 'REQ-3', title: 'Warn when inertia is low', kind: 'Requirement',
    sources: [{ source: 'SRC-4', quote: 'Operators want the screen to warn them when inertia is low, before anything trips' }], restsOn: ['ASM-1'] },
  { id: 'REQ-4', title: 'Show demand disconnection, never offer it', kind: 'Requirement',
    sources: [{ source: 'SRC-4', quote: 'The screen should say whether it has happened, never offer a button for it' }, { source: 'SRC-1', quote: 'Nobody presses a button for that' }], restsOn: ['RUL-3'] },
  { id: 'QST-1', title: 'Should the screen predict crossing the floor?', kind: 'Question' },

  // The new screen's parts.
  { id: 'SCR-1', title: 'Frequency readout', kind: 'Screen part',
    sources: [{ source: 'SRC-6', region: [0.08, 0.27, 0.42, 0.3], note: 'Kept from the current screen.' }], restsOn: ['PAR-4'] },
  { id: 'SCR-2', title: 'Rate of fall readout', kind: 'Screen part', restsOn: ['REQ-1'] },
  { id: 'SCR-3', title: 'Book extra response', kind: 'Screen part', restsOn: ['REQ-2'] },
  { id: 'SCR-4', title: 'Low inertia warning', kind: 'Screen part', restsOn: ['REQ-3'] },
  { id: 'SCR-5', title: 'Demand disconnection status', kind: 'Screen part', restsOn: ['REQ-4', 'QST-1'] }
];

// The physics, kept simple: one number for the whole grid's frequency.
const NOMINAL_HZ = 50;
const SYSTEM_MW = 30000;
const INERTIA_S = { calm: 4, windy: 2 };   // ASM-1: twice as fast on windy nights
const LOSS_MW = 1320;                      // PAR-3
const TRIP_AT_S = 1;
const TRIGGER_HZ = 49.8;                   // response starts below the normal band
const FAST = { heldMW: 1000, extraMW: 1000, fullAfterS: 2 };        // PAR-1, RUL-2
const PRIMARY = { heldMW: 800, fullAfterS: 10 };
const RELIEF_MW_PER_HZ = 600;              // demand falls a little as frequency falls
const LIMIT_HZ = 49.5;                     // PAR-4
const FLOOR_HZ = 48.8;                     // PAR-2, RUL-3
const DISCONNECT_MW = 1500;
const STEP_S = 0.1;
const RUN_S = 20;

function createModel(options) {
  const opts = { wind: 'calm', extraBooked: false, ...options };
  let state;

  function reset() {
    state = {
      time: 0, tripped: false, frequency: NOMINAL_HZ, rocof: 0, respondingSince: null,
      fastMW: 0, primaryMW: 0, disconnected: false, lowest: NOMINAL_HZ,
      history: [NOMINAL_HZ], done: false
    };
  }

  // A response ramps up evenly from when the frequency left the normal band, and gives as much of
  // that as the fall calls for: all of it by the time the frequency reaches the limit.
  const response = (heldMW, fullAfterS) => {
    if (state.respondingSince == null) return 0;
    const available = heldMW * Math.min(1, (state.time - state.respondingSince) / fullAfterS);
    const calledFor = Math.min(1, Math.max(0, (NOMINAL_HZ - state.frequency) / (NOMINAL_HZ - LIMIT_HZ)));
    return available * calledFor;
  };

  // Advances the model by a tenth of a second.
  function step() {
    if (state.done) return;
    state.time = Math.round((state.time + STEP_S) * 10) / 10;
    if (!state.tripped && state.time >= TRIP_AT_S) state.tripped = true;
    if (state.respondingSince == null && state.frequency < TRIGGER_HZ) state.respondingSince = state.time;
    if (!state.disconnected && state.frequency < FLOOR_HZ) state.disconnected = true;

    state.fastMW = response(FAST.heldMW + (opts.extraBooked ? FAST.extraMW : 0), FAST.fullAfterS);
    state.primaryMW = response(PRIMARY.heldMW, PRIMARY.fullAfterS);
    const relief = RELIEF_MW_PER_HZ * (NOMINAL_HZ - state.frequency);
    const imbalance = (state.tripped ? -LOSS_MW : 0) + state.fastMW + state.primaryMW + relief + (state.disconnected ? DISCONNECT_MW : 0);
    state.rocof = (imbalance * NOMINAL_HZ) / (2 * INERTIA_S[opts.wind] * SYSTEM_MW);
    state.frequency += state.rocof * STEP_S;
    state.lowest = Math.min(state.lowest, state.frequency);
    state.history.push(state.frequency);
    if (state.time >= RUN_S) state.done = true;
  }

  reset();

  return {
    get state() { return state; },
    get options() { return opts; },
    get lowInertia() { return opts.wind === 'windy'; },     // SCR-4, REQ-3
    get breached() { return state.lowest < LIMIT_HZ; },      // PAR-4
    items: ITEMS,
    limits: { limit: LIMIT_HZ, floor: FLOOR_HZ, nominal: NOMINAL_HZ, stepS: STEP_S, tripAtS: TRIP_AT_S },
    step,
    reset,
    setOption(key, value) { opts[key] = value; }
  };
}

// Lets Node load the model too, for its tests and Sandkit's tools.
if (typeof module !== 'undefined') module.exports = { createModel, ITEMS };
