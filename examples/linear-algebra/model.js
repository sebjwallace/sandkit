// Linear algebra model: vectors, their combinations, and matrices.
// A vector is a pair of numbers [x, y]: how far across, and how far up, its tip is from the origin.
// No UI here: the page draws what these functions describe.

const vectors = {
  add: ([a, b], [c, d]) => [a + c, b + d],

  // Stretches a vector by a number; a negative number also turns it round.
  scale: (k, [x, y]) => [k * x, k * y],

  // a·v + b·w: scale each, then add.
  combine(a, v, b, w) {
    return vectors.add(vectors.scale(a, v), vectors.scale(b, w));
  },

  // Whether two vectors lie along the same line through the origin (including when either is zero),
  // in which case their combinations can only ever reach that line.
  lineUp: ([a, b], [c, d]) => Math.abs(a * d - b * c) < 1e-9,

  same: ([a, b], [c, d]) => Math.abs(a - c) < 1e-9 && Math.abs(b - d) < 1e-9,

  // In words, as steps from the origin: "2 right, 1 up".
  describe([x, y]) {
    const across = x === 0 ? null : `${number(Math.abs(x))} ${x < 0 ? 'left' : 'right'}`;
    const up = y === 0 ? null : `${number(Math.abs(y))} ${y < 0 ? 'down' : 'up'}`;
    return [across, up].filter(Boolean).join(', ') || 'stay at the origin';
  }
};

// Matrices are rows of numbers, [[a, b], [c, d]]. Their columns are where î and ĵ land.
const matrices = {
  identity: [[1, 0], [0, 1]],

  // How much the matrix scales areas. Negative when it flips space over; zero when it squashes
  // space onto a line or a point.
  determinant: ([[a, b], [c, d]]) => a * d - b * c,

  // The single matrix that does `first`, then `second`: second · first.
  then(first, second) {
    const [[a, b], [c, d]] = second, [[p, q], [r, s]] = first;
    return [[a * p + b * r, a * q + b * s], [c * p + d * r, c * q + d * s]];
  },

  // Partway from doing nothing (t = 0) to the whole matrix (t = 1).
  blend: (m, t) => m.map((row, i) => row.map((value, j) => matrices.identity[i][j] + (value - matrices.identity[i][j]) * t))
};

// Numbers as people write them: a true minus sign, and no more than two decimal places.
function number(n) {
  const rounded = Math.round(n * 100) / 100 || 0;
  return rounded < 0 ? `−${-rounded}` : String(rounded);
}

// A number used inside a sum, bracketed when negative: 2 + (−1), not 2 + −1.
const term = (n) => (n < 0 ? `(${number(n)})` : number(n));

const pair = ([x, y]) => `(${number(x)}, ${number(y)})`;

// Lets Node load the model too, for model tests once the sandbox needs them.
if (typeof module !== 'undefined') module.exports = { vectors, matrices, number, term, pair };
