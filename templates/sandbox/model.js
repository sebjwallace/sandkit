// The domain model: the subject captured as code that runs.
// Pure domain only: it knows nothing of pages, components, saving or the clock.
// Shaping state for display is the view model's job, in the page or view.js.
// Compose it from mechanisms where they fit (see lib/sandkit/practices/mechanisms.md).
// The page reads `state`, calls `step()` and `reset()`, and changes options.

// Mechanisms load before this file in each page. Under Node, for model tests, the model loads
// them itself, one line each (declaring them in the page again would fail). So loading this file
// under Node also sets their globals; model tests still require them explicitly, to say where they come from:
// if (typeof module !== 'undefined') globalThis.SbStore = require('./lib/sandkit/mechanisms/sb-store/sb-store.js');

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
