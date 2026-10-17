// Linear algebra model, chapter 1: vectors.
// A vector is a pair of numbers [x, y]: how far across, and how far up, its tip is from the origin.
// No UI here: the page draws what these functions describe.

const vectors = {
  add: ([a, b], [c, d]) => [a + c, b + d],

  // In words, as steps from the origin: "2 right, 1 up".
  describe([x, y]) {
    const across = x === 0 ? null : `${Math.abs(x)} ${x < 0 ? 'left' : 'right'}`;
    const up = y === 0 ? null : `${Math.abs(y)} ${y < 0 ? 'down' : 'up'}`;
    return [across, up].filter(Boolean).join(', ') || 'stay at the origin';
  }
};

// Lets Node load the model too, for model tests once the sandbox needs them.
if (typeof module !== 'undefined') module.exports = { vectors };
