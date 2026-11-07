// Tests of the tags engine's public contract, in Node. Plain assertions, no libraries.

import { createRequire } from 'node:module';

const { createTags } = createRequire(import.meta.url)('./tags.js');

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { console.log(`✗ ${name} — ${err.message}`); process.exitCode = 1; }
}
const assertEqual = (actual, expected, message = '') => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const ids = ({ results }) => results.map(({ id }) => id);
const declare = (...names) => names.map((tag) => ({ tag, means: 'x' }));

// A harbour's notes, too few for rarity to count: every tag weighs the same.
const HARBOUR = createTags({
  tags: [...declare('tides', 'ferries', 'weather'), { tag: 'sailings', means: 'x', replacedBy: ['ferries'] }, { tag: 'gulls', means: 'x', replacedBy: [] }],
  items: [
    { id: 'NTE-1', kind: 'note', tags: ['tides'] },
    { id: 'NTE-2', kind: 'note', tags: ['tides', 'ferries'] },
    { id: 'NTE-3', kind: 'note', tags: ['tides', 'ferries', 'weather'] },
    { id: 'NTE-4', kind: 'note', tags: ['weather'] },
    { id: 'NTE-5', kind: 'note' }
  ]
});

// A library's catalogue, big enough for rarity to count: fiction is on most, maps on one.
const shelf = (n, tags) => ({ id: `BK-${n}`, kind: 'book', tags });
const LIBRARY = createTags({
  tags: declare('fiction', 'history', 'maps', 'poetry'),
  items: [
    shelf(1, ['fiction']), shelf(2, ['fiction']), shelf(3, ['fiction']), shelf(4, ['fiction']), shelf(5, ['fiction']),
    shelf(6, ['fiction', 'history']), shelf(7, ['fiction', 'poetry']), shelf(8, ['history']), shelf(9, ['history', 'maps']),
    shelf(10, ['poetry']), shelf(11, ['fiction', 'history'])
  ]
});

// A clinic's records, some replaced, one twice given, one carrying working tags.
const CLINIC_ITEMS = [
  { id: 'APT-1', tags: ['bloods'] },
  { id: 'APT-2', tags: ['bloods', 'fasting'], supersedes: 'APT-1' },
  { id: 'APT-3', tags: ['scans'], status: 'superseded' },
  { id: 'APT-4', tags: ['scans'] },
  { id: 'APT-4', tags: ['bloods'], working: ['monday-list'] },
  { tags: ['bloods'] }
];

test('clinic: superseded records are left out, the last of each id kept, and working tags never reach the map', () => {
  const clinic = createTags({ items: CLINIC_ITEMS, tags: declare('bloods', 'fasting', 'scans') });
  assertEqual(clinic.items().map(({ id, tags }) => [id, tags]), [['APT-2', ['bloods', 'fasting']], ['APT-4', ['bloods']]]);
  assertEqual(clinic.list().map(({ tag, on }) => [tag, on]), [['bloods', ['APT-2', 'APT-4']], ['fasting', ['APT-2']], ['scans', []]]);
  assert(!clinic.list().some(({ tag }) => tag === 'monday-list'), 'a working tag is listed');
});

test('clinic: what it is given is never changed', () => {
  const given = JSON.stringify(CLINIC_ITEMS);
  const clinic = createTags({ items: CLINIC_ITEMS, tags: declare('bloods') });
  clinic.find({ tags: ['bloods'] }); clinic.like(['APT-2']); clinic.ways({ tags: ['bloods'] });
  assertEqual(JSON.stringify(CLINIC_ITEMS), given);
});

test('harbour: all finds what carries every tag, closest to exactly those tags first, with what each carries and lacks', () => {
  const found = HARBOUR.find({ tags: ['tides', 'ferries'] });
  assertEqual(ids(found), ['NTE-2', 'NTE-3']);
  assertEqual(found.results.map(({ score }) => score), [1, 0.67]);
  assertEqual(found.results[1].carries, ['tides', 'ferries']);
  assertEqual(found.results[1].lacks, []);
  assertEqual(found.results[0].kind, 'note');
  assertEqual(found.results[0].item.id, 'NTE-2', 'the item itself, for a page to show');
});

test('harbour: any finds what carries at least one, more first, saying what each lacks', () => {
  const found = HARBOUR.find({ tags: ['ferries', 'weather'], match: 'any' });
  assertEqual(ids(found), ['NTE-3', 'NTE-4', 'NTE-2']);
  assertEqual(found.results[2].lacks, ['weather']);
});

test('harbour: without leaves out what carries a tag, and on its own leaves everything else tagged', () => {
  assertEqual(ids(HARBOUR.find({ tags: ['tides'], without: ['weather'] })), ['NTE-1', 'NTE-2']);
  assertEqual(ids(HARBOUR.find({ without: ['tides'] })), ['NTE-4']);
});

test('harbour: a preset passes as it is, its name and question ignored', () => {
  const preset = { name: 'Ferries in fair weather', asks: 'Which ferries ran in fair weather?', tags: ['ferries'], without: ['weather'] };
  assertEqual(ids(HARBOUR.find(preset)), ['NTE-2']);
});

test('harbour: a retired tag is followed to what replaced it, and the result says so', () => {
  const found = HARBOUR.find({ tags: ['sailings'] });
  assertEqual(ids(found), ['NTE-2', 'NTE-3']);
  assertEqual(found.followed, [{ from: 'sailings', to: ['ferries'] }]);
  assertEqual(found.selection.tags, ['ferries'], 'the selection as searched');
  const dropped = HARBOUR.find({ tags: ['gulls', 'weather'] });
  assertEqual(ids(dropped), ['NTE-4', 'NTE-3']);
  assertEqual(dropped.followed, [{ from: 'gulls', to: [] }]);
});

test('harbour: a tag never declared is named, and finding nothing is an answer', () => {
  const found = HARBOUR.find({ tags: ['otters'] });
  assertEqual(found, { results: [], total: 0, selection: { tags: ['otters'], match: 'all', without: [] }, followed: [], undeclared: ['otters'] });
});

test('harbour: limit caps the results, total says how many there were, and exclude leaves ids out', () => {
  const found = HARBOUR.find({ tags: ['tides'] }, { limit: 1, exclude: ['NTE-1'] });
  assertEqual(ids(found), ['NTE-2']);
  assertEqual(found.total, 2);
});

test('harbour: ties go by code, numbers counted as numbers, whatever order the items were given in', () => {
  const found = HARBOUR.find({ tags: ['tides', 'weather'], match: 'any' });
  assertEqual(found.results[1].score, found.results[2].score, 'a tie to test:');
  assertEqual(ids(found), ['NTE-3', 'NTE-1', 'NTE-4', 'NTE-2']);
  const shuffled = createTags({ items: [{ id: 'NTE-10', tags: ['tides'] }, { id: 'NTE-9', tags: ['tides'] }, { id: 'NTE-2', tags: ['tides'] }] });
  assertEqual(ids(shuffled.find({ tags: ['tides'] })), ['NTE-2', 'NTE-9', 'NTE-10']);
});

test('library: rarer tags weigh more, so a rare tag shared counts for more than a common one', () => {
  const found = LIBRARY.find({ tags: ['fiction', 'maps'], match: 'any' });
  assertEqual(ids(found)[0], 'BK-9', 'the one map book outranks the many novels');
  assert(found.results[0].score > found.results[1].score, 'and by more than a tie');
});

test('library: like scores each item by the one given it is closest to, naming it and what they share', () => {
  const liked = LIBRARY.like(['BK-9', 'BK-7']);
  assertEqual(liked.results[0], { id: 'BK-10', kind: 'book', score: 0.68, shares: ['poetry'], closest: 'BK-7', item: shelf(10, ['poetry']) });
  assertEqual(liked.results.find(({ id }) => id === 'BK-8').closest, 'BK-9');
  assert(!ids(liked).includes('BK-9') && !ids(liked).includes('BK-7'), 'what was given is left out');
  assert(liked.results.every(({ score }) => score > 0), 'only what shares something');
  assertEqual(LIBRARY.like(['BK-99']).unknown, ['BK-99']);
});

test('library: ways offer adding, dropping and switching, with counts, the gentlest first', () => {
  const { narrow, widen } = LIBRARY.ways({ tags: ['history'] });
  assertEqual(narrow.map(({ add, count }) => [add, count]), [['fiction', 2], ['maps', 1]]);
  assertEqual(widen, []);
  const both = LIBRARY.ways({ tags: ['fiction', 'history'] });
  assertEqual(both.widen.map(({ drop, match, count }) => [drop ?? match, count]), [['fiction', 4], ['history', 8], ['any', 10]]);
  assertEqual(both.widen[2].selection, { tags: ['fiction', 'history'], match: 'any', without: [] }, 'each way is a selection to take');
});

test('library: list gives every tag with what carries it, declared first, then any never declared', () => {
  const library = createTags({ items: [shelf(1, ['maps', 'atlases'])], tags: declare('maps', 'poetry') });
  assertEqual(library.list(), [
    { tag: 'maps', means: 'x', declared: true, on: ['BK-1'] },
    { tag: 'poetry', means: 'x', declared: true, on: [] },
    { tag: 'atlases', means: null, declared: false, on: ['BK-1'] }
  ]);
});

test('nothing given: every query answers, empty', () => {
  const empty = createTags();
  assertEqual(empty.find({ tags: ['x'] }).results, []);
  assertEqual(empty.like(['x']).results, []);
  assertEqual(empty.ways({ tags: ['x'] }), { narrow: [], widen: [] });
  assertEqual(empty.list(), []);
});

test('invariance: the same input gives the same output, for random catalogues', () => {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = (list) => list.filter(() => random() < 0.35);
  const names = ['a', 'b', 'c', 'd', 'e', 'f'];
  for (let round = 0; round < 20; round++) {
    const items = Array.from({ length: 5 + Math.floor(random() * 30) }, (_, i) => ({ id: `IT-${i}`, tags: pick(names) }));
    const selection = { tags: pick(names), match: random() < 0.5 ? 'any' : 'all', without: pick(names).slice(0, 1) };
    const once = createTags({ items, tags: declare(...names) }), again = createTags({ items, tags: declare(...names) });
    assertEqual(once.find(selection), again.find(selection), 'find');
    assertEqual(once.like(['IT-0', 'IT-1']), again.like(['IT-0', 'IT-1']), 'like');
    assertEqual(once.ways(selection), again.ways(selection), 'ways');
    for (const { score } of [...once.find(selection).results, ...once.like(['IT-0']).results]) assert(score >= 0 && score <= 1, `score ${score} out of 0 to 1`);
    for (const { count } of [...once.ways(selection).narrow, ...once.ways(selection).widen]) assert(count > 0, 'a way finding nothing');
  }
});
