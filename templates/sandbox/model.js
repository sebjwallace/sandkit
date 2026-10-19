// The domain model: the subject captured as code that runs.
// No UI here. The page reads `state`, calls `step()` and `reset()`, and changes options.

// The rules the model follows, with codes to cite them by (see lib/sandkit/practices/identifiers.md).
const RULES = [
  // { id: 'RUL-001', title: '{{Rule name}}', description: '{{What the rule says, in a sentence.}}' }
];

// Everything a person might trace, citing the passages it rests on (see lib/sandkit/practices/sources.md).
const ITEMS = [
  // { id: 'RUL-001', title: '{{Rule name}}', kind: 'Rule', sources: [{ source: 'SRC-1', quote: '{{the words it rests on}}' }], restsOn: [] }
];

function createModel(options) {
  const opts = { ...options };
  let state;

  function reset() {
    state = { time: 0 };
  }

  // Advances the model by one unit of time.
  function step() {
    state.time++;
  }

  reset();

  return {
    get state() { return state; },
    get options() { return opts; },
    rules: RULES,
    items: ITEMS,
    step,
    reset,
    setOption(key, value) { opts[key] = value; }
  };
}

// Lets Node load the model too, for model tests once the sandbox needs them (see the guide, step 4).
if (typeof module !== 'undefined') module.exports = { createModel, RULES, ITEMS };
