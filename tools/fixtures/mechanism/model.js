// A fixture sandbox's model, composed from the tally fixture mechanism and loading it as the
// mechanisms practice says: the page loads the mechanism first; under Node, the model loads it itself.
if (typeof module !== 'undefined') globalThis.SbTally = require('./lib/sandkit/mechanisms/sb-tally/sb-tally.js');

function createModel() {
  let shelf = SbTally.create({ limit: 3 });

  // Puts `amount` on the shelf, returning how many didn't fit.
  function stock(amount) {
    const result = SbTally.add(shelf, amount);
    shelf = result.state;
    return result.turnedAway;
  }

  return { get onShelf() { return shelf.count; }, stock };
}

if (typeof module !== 'undefined') module.exports = { createModel };
