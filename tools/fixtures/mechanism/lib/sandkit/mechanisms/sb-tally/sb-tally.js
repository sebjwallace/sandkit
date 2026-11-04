// Sandkit sb-tally 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A fixture for Sandkit's own tests, not a real mechanism: the smallest one there could be,
// for checking how mechanisms are set up, loaded and kept pure.
// A count that rises by what's added, up to a limit; anything past the limit is turned away.

const SbTally = (() => {
  // An empty tally holding up to `limit` (items).
  const create = ({ limit }) => ({ count: 0, limit });

  // Adds `amount` (items), returning the new state, and what was added and turned away.
  function add(state, amount) {
    const added = Math.min(amount, state.limit - state.count);
    return { state: { ...state, count: state.count + added }, added, turnedAway: amount - added };
  }

  return { create, add };
})();

if (typeof module !== 'undefined') module.exports = SbTally;
