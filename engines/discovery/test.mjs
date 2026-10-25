// Tests of the discovery engine's public contract, in Node. Plain assertions, no libraries.

import { createRequire } from 'node:module';

const { createDiscovery } = createRequire(import.meta.url)('./discovery.js');

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { console.log(`✗ ${name} — ${err.message}`); process.exitCode = 1; }
}
const assertEqual = (actual, expected, message = '') => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};
const assertThrows = (fn, message) => {
  try { fn(); } catch { return; }
  throw new Error(message);
};

// A river trust's sources, each graded 1 to 5 by whoever catalogued it, with the reason.
const grade = (value, why) => ({ value, why });
const SOURCES = [
  { id: 'SRC-1', format: 'data', grade: grade(5, 'Counted on the banks by trained surveyors.') },         // the spraint survey
  { id: 'SRC-2', format: 'web', grade: grade(2, 'Anglers’ impressions, second-hand, unchecked.') },        // a forum thread
  { id: 'SRC-3', format: 'document', copies: 'SRC-2', grade: grade(2, 'Repeats the forum.') },             // a newsletter repeating it
  { id: 'SRC-4', format: 'document', speaksTo: 'what should be', grade: grade(5, 'The trust’s own plan.') }, // the plan
  { id: 'SRC-5', format: 'data', iteration: 2, grade: grade(4, 'Lab results; sampling sites chosen by us.') }, // eDNA, arriving later
  { id: 'SRC-6', format: 'notes', grade: grade(4, 'A warden’s own notes, written the same day.') },
  { id: 'SRC-7', format: 'notes', derivedFrom: 'SRC-6' },                                                  // a summary, not graded yet
];
const claim = (id, assertions) => ({ id, text: id, assertions });
const CLAIMS = [
  claim('CLM-1', { 'SRC-1': ['+', 'spraint at 4 of 18'], 'SRC-2': ['+', 'not one above the bridge'], 'SRC-5': ['−', 'DNA at 9 of 12'] }),
  claim('CLM-2', { 'SRC-2': ['+', 'they’ve gone'], 'SRC-3': ['+', 'anglers say they’ve gone'] }),
  claim('CLM-3', { 'SRC-4': ['+', 'otters will return'], 'SRC-6': ['+', 'saw one at dusk'] }),
  claim('CLM-4', { 'SRC-6': ['-', 'none seen all spring'] }),
  claim('CLM-5', { 'SRC-7': ['+', 'fewer sightings'] }),
  claim('CLM-6', {}),
];
const discovery = createDiscovery({ sources: SOURCES, claims: CLAIMS });
const weigh = (id, options) => discovery.weigh(id, options);

// ---- Strength ----

test('a source’s strength is its authored grade', () => {
  assertEqual([discovery.strength('SRC-1'), discovery.strength('SRC-2'), discovery.strength('SRC-6')], [5, 2, 4]);
});

test('a source not graded yet weighs as ordinary, and its passages say so', () => {
  const [passage] = weigh('CLM-5').passages;
  assertEqual([discovery.strength('SRC-7'), passage.strength, passage.ungraded], [3, 3, true]);
  assertEqual(weigh('CLM-4').passages[0].ungraded, undefined);
});

// ---- Standing ----

test('two independent yeses corroborate a claim', () => {
  assertEqual(weigh('CLM-1', { asOf: 1 }).standing, 'corroborated');
});

test('a yes and a no contest it; only noes refute it; nothing backs it unbacked', () => {
  assertEqual([weigh('CLM-1').standing, weigh('CLM-4').standing, weigh('CLM-6').standing], ['contested', 'refuted', 'unbacked']);
});

test('a no typed as a plain hyphen is still a no', () => {
  assertEqual(weigh('CLM-4').passages[0].stance, '−');
});

test('a copy counts once: the forum and the newsletter repeating it are one source', () => {
  const weighed = weigh('CLM-2');
  assertEqual([weighed.standing, weighed.score], ['single source', 2]);
  assertEqual(weighed.passages.map((p) => [p.source, p.counted, p.repeats ?? null]), [['SRC-2', true, null], ['SRC-3', false, 'SRC-2']]);
});

test('a source saying what should be shows but isn’t counted: a plan isn’t evidence of what happens', () => {
  const weighed = weigh('CLM-3');
  assertEqual([weighed.standing, weighed.score], ['single source', 4]);
  assertEqual(weighed.passages.find((p) => p.source === 'SRC-4'), { source: 'SRC-4', stance: '+', quote: 'otters will return', strength: 5, counted: false, outOfScope: 'what should be' });
});

// ---- Score ----

test('the score is each counted yes’s strength, less each counted no’s', () => {
  assertEqual([weigh('CLM-1', { asOf: 1 }).score, weigh('CLM-1').score, weigh('CLM-4').score], [7, 3, -4]);
});

// ---- Basis ----

test('basis: observed when data backs it, reported when someone says so first-hand, inferred when only a summary does', () => {
  assertEqual([weigh('CLM-1').basis, weigh('CLM-3').basis, weigh('CLM-5').basis], ['observed', 'reported', 'inferred']);
});

test('with nothing behind it, a claim is a conjecture, or an assumption once something rests on it', () => {
  assertEqual([weigh('CLM-6').basis, weigh('CLM-6', { reliedOn: true }).basis], ['conjecture', 'assumption']);
});

// ---- As of an iteration ----

test('as of an iteration, only the sources that had arrived by then are weighed', () => {
  const then = weigh('CLM-1', { asOf: 1 }), now = weigh('CLM-1', { asOf: 2 });
  assertEqual([then.standing, then.passages.length, now.standing, now.passages.length], ['corroborated', 2, 'contested', 3]);
});

// ---- Records ----

test('weighs a claim given as a record, as well as by its id', () => {
  assertEqual(discovery.weigh(claim('CLM-9', { 'SRC-1': ['+', 'seen'] })).standing, 'single source');
});

test('never changes the records it’s given', () => {
  const before = JSON.stringify(CLAIMS);
  CLAIMS.forEach((c) => weigh(c.id));
  assertEqual(JSON.stringify(CLAIMS), before);
});

test('says plainly when a claim or a source isn’t there', () => {
  assertThrows(() => weigh('CLM-404'), 'an unknown claim throws');
  assertThrows(() => discovery.weigh(claim('CLM-9', { 'SRC-404': ['+', 'x'] })), 'an unknown source throws');
});
