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
  entities: [{ id: 'ENT-1', iteration: 3, name: 'Holt', foundedOn: ['DEC-1'] }],
  model: { versions: [{ iteration: 3, parts: { 'ENT-1': class Holt {} } }] },
});
const linked = (from, to) => loop.links().some((l) => l.from === from && l.to === to);
// What an iteration shows, in a fixed order: which order cards stand in is the sandbox's to choose.
const shows = (k) => Object.fromEntries(loop.iteration(k).cards.map((c) => [c.id, c.as === 'carried' ? `carried from ${c.from}` : c.as]).sort());

test('links run from what a record rests on to the record, and from a record to what it bears on', () => {
  assert(linked('SRC-1', 'CLM-1') && linked('CLM-1', 'QST-1') && linked('QST-1', 'INV-1') && linked('INV-1', 'SRC-2'), 'passages, informs, prompts, gathers');
  assert(linked('CLM-1', 'DEC-1') && linked('SRC-3', 'CON-1') && linked('DEC-1', 'ACT-1'), 'rests on, set in, brought about');
});

test('the model’s runs are records too, and link like any other', () => {
  assert(linked('ENT-1', 'RUN-1'), 'a run rests on what it changed');
});

test('each link says what it means', () => {
  const means = (from, to) => loop.links().find((l) => l.from === from && l.to === to)?.means;
  assertEqual([means('SRC-1', 'CLM-1'), means('SRC-2', 'CLM-1'), means('SRC-1', 'QST-1'), means('CLM-1', 'QST-1')],
    ['supports', 'disputes', 'asks', 'informs'], 'a passage’s stance; a question raised, a claim informing it');
  assertEqual([means('QST-1', 'INV-1'), means('INV-1', 'SRC-2'), means('SRC-3', 'CON-1')], ['prompts', 'gathered', 'imposes']);
  assertEqual([means('CLM-1', 'DEC-1'), means('CON-1', 'DEC-1'), means('DEC-1', 'ACT-1'), means('ENT-1', 'RUN-1')],
    ['grounds', 'constrains', 'calls for', 'run in']);
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
  assertEqual(shows(3), { 'ACT-1': 'raised', 'DEC-1': 'carried from 2', 'ENT-1': 'raised', 'RUN-1': 'raised' });
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

// ---- The model ----

// The trust's model of its holts over two iterations: iteration 2 patches the holt so an old spraint
// doesn't count, and tries a survey of many holts in a candidate model; a grid reference is turned down.
class Count {
  static constraints = ['A whole number, never below 0.'];
  constructor(n) { this.n = n; }
}
class Holt {
  static properties = { spraints: Count, fresh: 'yes or no' };
  constructor({ spraints, fresh = true }) { this.spraints = spraints; this.fresh = fresh; }
  occupied() { return this.spraints.n > 0; } // if a holt has spraint, it's in use: "if" here is no decision
}
class HoltWithFreshness extends Holt {
  occupied() {
    if (this.fresh === false) return false;
    return super.occupied();
  }
}
class Survey {
  constructor(holts) { this.holts = holts; }
  occupiedCount() { return this.holts.length ? this.holts.filter((holt) => holt.occupied()).length : 0; }
}
const holtOf = (M, n, fresh) => new M.Holt({ spraints: new M.Count(n), fresh });
const river = createDiscovery({
  definitions: [{ id: 'DEF-1', iteration: 1, term: 'holt', setIn: ['SRC-1', 'an otter’s den'] }],
  sources: [{ id: 'SRC-1', iteration: 1, format: 'document' }],
  primitives: [
    { id: 'PRM-1', iteration: 1, name: 'count', foundedOn: [] },
    { id: 'PRM-2', iteration: 1, name: 'grid reference', foundedOn: [], rejected: { in: 2, why: 'Nothing needs it yet.' } },
  ],
  entities: [
    { id: 'ENT-1', iteration: 1, name: 'holt', foundedOn: ['DEF-1'] },
    { id: 'ENT-2', iteration: 1, name: 'survey', foundedOn: [] },
  ],
  scenarios: [
    { id: 'SCN-1', iteration: 1, foundedOn: [], steps: [{ keyword: 'Given', text: 'three spraints' }, { keyword: 'Then', text: 'the holt is occupied' }],
      play: (M) => [null, { ok: holtOf(M, 3).occupied(), actual: 'empty' }] },
    { id: 'SCN-2', iteration: 2, foundedOn: [], steps: [{ keyword: 'Given', text: 'one old spraint' }, { keyword: 'Then', text: 'the holt is empty' }],
      play: (M) => [null, { ok: !holtOf(M, 1, false).occupied(), actual: 'occupied' }] },
    { id: 'SCN-3', iteration: 2, foundedOn: [], steps: [{ keyword: 'Given', text: 'two holts, one with spraint' }, { keyword: 'Then', text: 'one is occupied' }],
      play: (M) => [null, { ok: new M.Survey([holtOf(M, 2), holtOf(M, 0)]).occupiedCount() === 1, actual: 'another count' }] },
  ],
  rules: [
    { id: 'RUL-1', iteration: 2, foundedOn: [], check: (M) => [0].filter((n) => holtOf(M, n).occupied()).map((n) => `a holt with ${n} spraints`) },
  ],
  model: {
    versions: [
      { iteration: 1, parts: { 'PRM-1': Count, 'ENT-1': Holt } },
      { iteration: 2, parts: { 'PRM-1': Count, 'ENT-1': HoltWithFreshness } },
    ],
    candidates: [{ iteration: 2, tries: 'ENT-2', parts: { 'PRM-1': Count, 'ENT-1': HoltWithFreshness, 'ENT-2': Survey } }],
  },
});

test('a part is proposed, trying once a candidate tries it, integrated once the model holds it, rejected once turned down', () => {
  assertEqual(['ENT-1', 'ENT-2', 'PRM-2'].map((id) => [1, 2].map((k) => river.status(id, { asOf: k }))),
    [['integrated', 'integrated'], ['proposed', 'trying'], ['proposed', 'rejected']]);
});

test('a scenario or rule is met or not, against the model as it stood', () => {
  assertEqual(['SCN-1', 'SCN-2', 'SCN-3', 'RUL-1'].map((id) => [1, 2].map((k) => river.status(id, { asOf: k }))),
    [['met', 'met'], ['not met', 'met'], ['not met', 'not met'], ['met', 'met']]);
});

test('what a test said: each step’s result, or the cases a rule fails for', () => {
  assertEqual(river.results('SCN-2', { asOf: 1 }), [null, { ok: false, actual: 'occupied' }]);
  assertEqual(river.results('SCN-2', { asOf: 2 }), [null, { ok: true }], 'what happened is only said where it wasn’t expected');
  assertEqual(river.results('RUL-1'), []);
});

test('a scenario the model can’t play fails every step it checks, saying why', () => {
  const [given, then] = river.results('SCN-3', { asOf: 2 });
  assert(given === null && then.ok === false && then.actual.includes('Survey'), JSON.stringify(then));
});

test('the model by an iteration: its parts, its classes by their names, and its size', () => {
  const { iteration, parts, classes, decisions, busiest } = river.model(2);
  assertEqual([iteration, Object.keys(parts), Object.keys(classes)], [2, ['PRM-1', 'ENT-1'], ['Count', 'Holt']]);
  assert(classes.Holt === HoltWithFreshness, 'a class goes by its part’s name');
  assertEqual([decisions, busiest], [1, { name: 'HoltWithFreshness.occupied', decisions: 1 }]);
});

test('decisions are counted in the code with strings and comments taken out', () => {
  assertEqual(river.model(1).decisions, 0, 'the "if" in Holt’s comment');
  assertEqual(river.decisionsIn(HoltWithFreshness).map(({ cls, decisions, methods }) => [cls.name, decisions, methods]),
    [['Holt', 0, [{ name: 'occupied', decisions: 0 }]], ['HoltWithFreshness', 1, [{ name: 'occupied', decisions: 1 }]]]);
});

test('a class’s getters are left alone when its decisions are counted', () => {
  class Minutes {
    constructor(text) { this.text = text; }
    get total() { return this.text.trim() ? Number(this.text) : 0; }
    later(other) { return this.total > other.total; }
  }
  const timed = createDiscovery({ primitives: [{ id: 'PRM-1', iteration: 1, name: 'minutes', foundedOn: [] }],
    model: { versions: [{ iteration: 1, parts: { 'PRM-1': Minutes } }] } });
  assertEqual(timed.decisionsIn(Minutes)[0].methods, [{ name: 'later', decisions: 0 }]);
  assertEqual(timed.model(1).decisions, 1, 'the getter’s choice still counts in the class');
});

test('a run for each version of the model and each candidate', () => {
  assertEqual(river.runs(), ['RUN-1', 'RUN-2', 'RUN-3']);
  assertEqual(['RUN-1', 'RUN-2', 'RUN-3'].map((id) => river.run(id)).map(({ iteration, tries, changes }) => [iteration, tries, changes]),
    [[1, undefined, ['PRM-1', 'ENT-1']], [2, undefined, ['ENT-1']], [2, 'ENT-2', ['ENT-2']]]);
});

test('a run finds which tests written by its iteration are met, and what changed against the version before', () => {
  const { tests, met, notMet, change, arrived, metOnArrival } = river.run('RUN-2');
  assertEqual([tests, met, notMet], [['SCN-1', 'SCN-2', 'SCN-3', 'RUL-1'], ['SCN-1', 'SCN-2', 'RUL-1'], ['SCN-3']]);
  assertEqual(change, { met: ['SCN-2'], broken: [], added: 0, decisions: 1, inPlace: 1,
    kind: 'a patch, adding to existing code to meet one test', earnsItsPlace: true });
  assertEqual([arrived, metOnArrival], [['SCN-2', 'SCN-3', 'RUL-1'], ['RUL-1']], 'what the version before already met');
  assertEqual(river.run('RUN-1').change, null, 'the first version has nothing before it');
});

test('a trial is set against the model it would join, and earns its place by meeting more and breaking nothing', () => {
  const { change, arrived } = river.run('RUN-3');
  assertEqual(change, { met: ['SCN-3'], broken: [], added: 1, decisions: 1, inPlace: 0,
    kind: 'met by a new part, the rest untouched: new capability', earnsItsPlace: true });
  assertEqual(arrived, [], 'only a version of the model meets tests on arrival');
});

test('a change that breaks what was met never earns its place, whatever it meets', () => {
  const careless = createDiscovery({
    primitives: [{ id: 'PRM-1', iteration: 1, name: 'count', foundedOn: [] }],
    entities: [{ id: 'ENT-1', iteration: 1, name: 'holt', foundedOn: [] }],
    scenarios: [
      { id: 'SCN-1', iteration: 1, foundedOn: [], steps: [], play: (M) => [{ ok: holtOf(M, 3).occupied() }] },
      { id: 'SCN-2', iteration: 2, foundedOn: [], steps: [], play: (M) => [{ ok: !holtOf(M, 1, false).occupied() }] },
    ],
    model: { versions: [
      { iteration: 1, parts: { 'PRM-1': Count, 'ENT-1': Holt } },
      { iteration: 2, parts: { 'PRM-1': Count, 'ENT-1': class Empty extends Holt { occupied() { return false; } } } },
    ] },
  });
  const { met, broken, kind, earnsItsPlace } = careless.run('RUN-2').change;
  assertEqual([met, broken, kind, earnsItsPlace], [['SCN-2'], ['SCN-1'], 'it breaks what was met', false]);
});

test('a run rests on what it changed, an entity on its primitives, and a test on the runs that say something about it', () => {
  assertEqual(river.inputsOf('RUN-2').records, ['ENT-1']);
  assertEqual(river.inputsOf('ENT-1').records, ['DEF-1', 'PRM-1']);
  const links = river.iteration(2).links.map((l) => `${l.from}→${l.to}`);
  assert(links.includes('RUN-2→SCN-3') && links.includes('RUN-3→SCN-3'), 'the model’s run, and the trial meeting it');
  assert(!links.includes('RUN-3→SCN-2'), 'a trial says nothing of a test it doesn’t newly meet');
});

test('a run meets a test or doesn’t, a trial is tried, and a part is founded on what defines it', () => {
  const means = (from, to) => river.iteration(2).links.find((l) => l.from === from && l.to === to)?.means;
  assertEqual([means('RUN-3', 'SCN-3'), means('RUN-2', 'SCN-3'), means('ENT-2', 'RUN-3')], ['meets', 'doesn’t meet', 'tried in']);
  assertEqual([river.links().find((l) => l.from === 'PRM-1' && l.to === 'ENT-1').means, river.links().find((l) => l.from === 'DEF-1').means],
    ['part of', 'founds']);
});

test('a part comes back when its version or stage changes, a test when what it says does', () => {
  assertEqual(['ENT-1', 'PRM-1', 'PRM-2', 'SCN-1', 'SCN-2'].map((id) => river.appearances(id)), [[1, 2], [1], [1, 2], [1], [2]]);
});

test('what each test exercised of a part: an entity made or called, a primitive’s value read', () => {
  assertEqual(river.exercisedBy('ENT-1', { asOf: 1 }), [{ test: 'SCN-1', made: true, calls: ['occupied'], reads: ['spraints'] }]);
  // SCN-2 makes a count too, but its old spraint settles it before the count is read.
  assertEqual(river.exercisedBy('PRM-1', { asOf: 2 }).map(({ test, reads }) => [test, reads]), [['SCN-1', ['n']], ['RUL-1', ['n']]]);
});

test('a part’s class, its primitives and its definition', () => {
  assertEqual([river.partOfClass(HoltWithFreshness, 2), river.partOfClass(HoltWithFreshness, 1)], ['ENT-1', undefined]);
  assertEqual(river.primitivesOf('ENT-1'), ['PRM-1'], 'a property naming a primitive’s class; a plain description isn’t one');
  assertEqual([river.definitionOf('ENT-1')?.id, river.definitionOf('ENT-2')], ['DEF-1', null]);
});

test('a run, scenario or rule it doesn’t have throws', () => {
  assertThrows(() => river.run('RUN-9'), 'an unknown run throws');
  assertThrows(() => river.results('ENT-1'), 'a part isn’t a test');
});

// ---- Feedback ----

// Wardens try the model of iteration 1 and comment; the comments are saved as a source in iteration 2.
const heard = createDiscovery({
  sources: [
    { id: 'SRC-1', iteration: 1, format: 'document', speaksTo: 'what should be' },
    { id: 'SRC-2', iteration: 2, format: 'annotations' },
  ],
  claims: [{ id: 'CLM-1', iteration: 1, assertions: { 'SRC-1': ['+', 'every holt is surveyed in spring'] } }],
  entities: [{ id: 'ENT-1', iteration: 1, name: 'holt', foundedOn: [] }],
  feedback: [
    { id: 'FB-1', iteration: 2, said: ['SRC-2', 'an old spraint doesn’t mean they’re back'], about: 'ENT-1', verdict: 'wrong' },
    { id: 'FB-2', iteration: 2, said: ['SRC-2', 'occupied reads right'], about: 'ENT-1', verdict: 'works' },
    { id: 'FB-3', iteration: 2, said: ['SRC-2', 'show the survey dates too'], about: 'prototype', verdict: 'wrong', declined: 'Dates are out of this sandbox’s scope.' },
  ],
  scenarios: [{ id: 'SCN-1', iteration: 3, foundedOn: ['FB-1'], steps: [], play: () => [] }],
});
const meansIn = (d, from, to) => d.links().find((l) => l.from === from && l.to === to)?.means;

test('feedback is open, answered once something is founded on it, or declined as written', () => {
  assertEqual(['FB-1', 'FB-2', 'FB-3'].map((id) => heard.status(id, { asOf: 2 })), ['open', 'open', 'declined']);
  assertEqual(heard.status('FB-1', { asOf: 3 }), 'answered');
});

test('feedback is voiced in a source, says the model is wrong or works, and founds what answers it', () => {
  assertEqual([meansIn(heard, 'SRC-2', 'FB-1'), meansIn(heard, 'FB-1', 'ENT-1'), meansIn(heard, 'FB-2', 'ENT-1'), meansIn(heard, 'FB-1', 'SCN-1')],
    ['voices', 'disputes', 'bears out', 'founds']);
});

test('feedback about the prototype, which isn’t a record, links only to where it was said', () => {
  assertEqual(heard.links().filter((l) => l.from === 'FB-3' || l.to === 'FB-3').map((l) => `${l.from}→${l.to}`), ['SRC-2→FB-3']);
});

test('a source saying what should be says so of a claim, without supporting or disputing it', () => {
  assertEqual(meansIn(heard, 'SRC-1', 'CLM-1'), 'says it should');
});
