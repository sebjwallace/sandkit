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
const assert = (condition, message) => { if (!condition) throw new Error(message); };
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

// ---- Statuses ----

// The river trust's discovery, iteration by iteration: what it asked, assumed, reasoned and decided.
const lake = createDiscovery({
  sources: [
    ...SOURCES,
    { id: 'SRC-8', format: 'data', gatheredBy: 'INV-1', iteration: 2, grade: grade(4, 'Camera traps, set by us.') },
  ],
  claims: CLAIMS,
  questions: [
    { id: 'QST-1', iteration: 1, answer: 'Still there, leaving fewer signs.', answers: { 'SRC-5': 'DNA at 9 of 12' } },
    { id: 'QST-2', iteration: 1, answers: { 'SRC-1': 'spraint at 4 of 18' } },
  ],
  assumptions: [{ id: 'ASM-1', iteration: 1 }, { id: 'ASM-2', iteration: 1 }, { id: 'ASM-3', iteration: 1 }],
  observations: [
    { id: 'OBS-1', iteration: 2, tests: ['ASM-1', '−'], resultOf: 'EXP-1' },
    { id: 'OBS-2', iteration: 1, tests: ['ASM-2', '+'] },
    { id: 'OBS-3', iteration: 2, tests: ['ASM-2', '-'] },
    { id: 'OBS-4', iteration: 2, tests: ['PRD-2', '+'] },
  ],
  inferences: [
    { id: 'INF-1', iteration: 1, premises: ['ASM-1'] },
    { id: 'INF-2', iteration: 1, premises: ['INF-1'] },
    { id: 'INF-3', iteration: 1, premises: ['CLM-1', 'OBS-2'] },
    { id: 'INF-4', iteration: 1, premises: ['CLM-3'] },
  ],
  predictions: [
    { id: 'PRD-1', iteration: 1, from: 'DEC-1' },
    { id: 'PRD-2', iteration: 1, from: 'DEC-2' },
    { id: 'PRD-3', iteration: 1, from: 'DEC-2' },
  ],
  outcomes: [
    { id: 'OUT-1', iteration: 2, against: 'PRD-1', result: 'partly' },
    { id: 'OUT-2', iteration: 2, against: 'PRD-1', result: 'failed' },
    { id: 'OUT-3', iteration: 2, against: 'PRD-3', result: 'worked' },
  ],
  investigations: [{ id: 'INV-1', iteration: 1 }],
  experiments: [{ id: 'EXP-1', iteration: 1 }],
  actions: [{ id: 'ACT-1', iteration: 1, status: 'to do', done: 'SRC-8' }],
  decisions: [
    { id: 'DEC-1', iteration: 1, status: 'accepted', restsOn: ['CLM-1', 'ASM-1'] },
    { id: 'DEC-2', iteration: 1, status: 'accepted', restsOn: ['CLM-4', 'ASM-3'] },
    { id: 'DEC-3', iteration: 2, status: 'proposed', restsOn: ['CLM-1'] },
  ],
});
const status = (id, asOf) => lake.status(id, { asOf });

test('a claim’s status is its standing', () => {
  assertEqual([status('CLM-1', 1), status('CLM-1', 2)], ['corroborated', 'contested']);
});

test('a question is answered once a source answering it has arrived and the answer is written; unresolved until then', () => {
  assertEqual([status('QST-1', 1), status('QST-1', 2), status('QST-2', 2)], ['unresolved', 'answered', 'unresolved']);
});

test('an assumption is untested until an observation tests it; any no refutes it, whatever said yes', () => {
  assertEqual([status('ASM-1', 1), status('ASM-1', 2), status('ASM-2', 1), status('ASM-2', 2), status('ASM-3', 2)],
    ['untested', 'refuted', 'confirmed', 'refuted', 'untested']);
});

test('an inference is shaken once any premise is in doubt: a claim turned, an assumption refuted, an inference shaken', () => {
  assertEqual([status('INF-1', 1), status('INF-1', 2), status('INF-2', 2), status('INF-3', 1), status('INF-3', 2), status('INF-4', 2)],
    ['sound', 'shaken', 'shaken', 'sound', 'shaken', 'sound']);
});

test('a prediction is pending, then supported or in doubt by results, then measured by its latest outcome', () => {
  assertEqual([status('PRD-1', 1), status('PRD-1', 2), status('PRD-2', 1), status('PRD-2', 2), status('PRD-3', 2)],
    ['pending', 'not borne out', 'pending', 'supported', 'borne out']);
});

test('an investigation is done once a source it gathered arrives; an experiment once a result does', () => {
  assertEqual([status('INV-1', 1), status('INV-1', 2), status('EXP-1', 1), status('EXP-1', 2)], ['under way', 'done', 'planned', 'done']);
});

test('an action keeps its written status until what shows it’s done arrives', () => {
  assertEqual([status('ACT-1', 1), status('ACT-1', 2)], ['to do', 'done']);
});

test('a decision goes under review when its grounds turn after it was taken, or what it predicted fails', () => {
  assertEqual([status('DEC-1', 1), status('DEC-1', 2)], ['accepted', 'review']);
  assertEqual(lake.reviewReasons('DEC-1', { asOf: 2 }), [
    { ref: 'CLM-1', now: 'contested', why: 'rests on' },
    { ref: 'ASM-1', now: 'refuted', why: 'rests on' },
    { ref: 'PRD-1', now: 'not borne out', why: 'predicted' },
  ]);
});

test('grounds already in doubt when a decision was taken were part of its reasoning, not a reason to review it', () => {
  assertEqual([lake.reviewReasons('DEC-2', { asOf: 2 }), status('DEC-2', 2)], [[], 'accepted']);
  assertEqual([lake.reviewReasons('DEC-3', { asOf: 2 }), status('DEC-3', 2)], [[], 'proposed']);
});

test('a kind without a rule keeps what its record says; an unknown record is named', () => {
  assertEqual([status('OBS-1'), status('OUT-1')], [null, 'partly']);
  assertThrows(() => lake.status('XYZ-1'), 'an unknown record throws');
  assertThrows(() => lake.reviewReasons('DEC-404'), 'an unknown decision throws');
});

// ---- Links and iterations ----

// The trust's discovery over three iterations: what rests on what, and what each iteration shows.
const loop = createDiscovery({
  sources: [
    { id: 'SRC-1', iteration: 1, format: 'data', grade: grade(5, 'Counted on the banks.') },
    { id: 'SRC-2', iteration: 2, format: 'data', gatheredBy: 'INV-1', grade: grade(4, 'Lab results.') },
    { id: 'SRC-3', iteration: 1, format: 'document', speaksTo: 'what should be' },
  ],
  claims: [
    { id: 'CLM-1', iteration: 1, assertions: { 'SRC-1': ['+', 'spraint at 4'], 'SRC-2': ['−', 'DNA at 9'] }, informs: ['QST-1'] },
  ],
  questions: [{ id: 'QST-1', iteration: 1, raisedBy: ['SRC-1', 'are they gone?'], answers: {} }],
  investigations: [{ id: 'INV-1', iteration: 1, prompt: 'QST-1' }],
  constraints: [{ id: 'CON-1', iteration: 1, setIn: ['SRC-3', 'no new hides'] }],
  decisions: [{ id: 'DEC-1', iteration: 1, status: 'accepted', restsOn: ['CLM-1', 'CON-1'], sources: [] }],
  actions: [{ id: 'ACT-1', iteration: 3, from: 'DEC-1', sources: [] }],
  also: { records: [{ id: 'RUN-1', iteration: 3 }], inputs: (id) => (id === 'RUN-1' ? ['ACT-1'] : []) },
});
const linked = (from, to) => loop.links().some((l) => l.from === from && l.to === to);
// What an iteration shows, in a fixed order: which order cards stand in is the sandbox's to choose.
const shows = (k) => Object.fromEntries(loop.iteration(k).cards.map((c) => [c.id, c.as === 'carried' ? `carried from ${c.from}` : c.as]).sort());

test('links run from what a record rests on to the record, and from a record to what it bears on', () => {
  assert(linked('SRC-1', 'CLM-1') && linked('CLM-1', 'QST-1') && linked('QST-1', 'INV-1') && linked('INV-1', 'SRC-2'), 'passages, informs, prompts, gathers');
  assert(linked('CLM-1', 'DEC-1') && linked('SRC-3', 'CON-1') && linked('DEC-1', 'ACT-1'), 'rests on, set in, brought about');
});

test('what the model knows is handed in, and links like any other', () => {
  assert(linked('ACT-1', 'RUN-1'), 'a run rests on what it changed');
});

test('each link is listed once', () => {
  const keys = loop.links().map((l) => `${l.from} ${l.to}`);
  assertEqual(keys.length, new Set(keys).size);
});

test('what a record rests on: its sources and its records, apart', () => {
  assertEqual(loop.inputsOf('DEC-1'), { sources: [], records: ['CLM-1', 'CON-1'] });
  assertEqual(loop.inputsOf('CLM-1'), { sources: ['SRC-1', 'SRC-2'], records: [] });
});

test('a record appears where it was raised and again where new material reaches it; a decision comes back with its grounds', () => {
  assertEqual([loop.appearances('CLM-1'), loop.appearances('DEC-1'), loop.appearances('CON-1')], [[1, 2], [1, 2], [1]]);
});

test('an investigation comes back when what it gathered arrives', () => {
  assertEqual(loop.appearances('INV-1'), [1, 2]);
});

test('an iteration shows what was raised in it, what came back updated, and what its records rest on, carried in', () => {
  assertEqual(shows(1), { 'CLM-1': 'raised', 'CON-1': 'raised', 'DEC-1': 'raised', 'INV-1': 'raised', 'QST-1': 'raised', 'SRC-1': 'raised', 'SRC-3': 'raised' });
  assertEqual(shows(2), { 'CLM-1': 'updated', 'DEC-1': 'updated', 'INV-1': 'updated', 'SRC-2': 'raised' });
  assertEqual(shows(3), { 'ACT-1': 'raised', 'DEC-1': 'carried from 2', 'RUN-1': 'raised' });
});

test('an iteration’s links are only those among the cards it shows, by id', () => {
  const { links } = loop.iteration(2);
  assertEqual(links.map((l) => `${l.from}→${l.to}`).sort(), ['CLM-1→DEC-1', 'INV-1→SRC-2', 'SRC-2→CLM-1']);
});

test('what brought a record about links to it only where it did', () => {
  // The decision and its prediction both come back in iteration 2, but the decision brought the
  // prediction about in iteration 1, so iteration 2 doesn't link them again.
  const later = createDiscovery({
    sources: [{ id: 'SRC-1', iteration: 2, format: 'data' }],
    claims: [{ id: 'CLM-1', iteration: 1, assertions: { 'SRC-1': ['+', 'seen'] } }],
    decisions: [{ id: 'DEC-1', iteration: 1, status: 'accepted', restsOn: ['CLM-1'], sources: [] }],
    predictions: [{ id: 'PRD-1', iteration: 1, from: 'DEC-1' }],
    observations: [{ id: 'OBS-1', iteration: 2, at: ['SRC-1', 'x'], tests: ['PRD-1', '+'] }],
  });
  assertEqual([later.appearances('DEC-1'), later.appearances('PRD-1')], [[1, 2], [1, 2]]);
  assertEqual(later.iteration(1).links.some((l) => l.from === 'DEC-1' && l.to === 'PRD-1'), true);
  assertEqual(later.iteration(2).links.some((l) => l.from === 'DEC-1' && l.to === 'PRD-1'), false);
});
