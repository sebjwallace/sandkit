// Tests for sb-profile's core, in Node. Plain assertions, no libraries; run with `node components/sb-profile/test.mjs`.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Loaded as tools/analyse.mjs loads it: the script hands its core to `module.exports`.
const SCRIPT = resolve(fileURLToPath(import.meta.url), '../sb-profile.js');
const module = { exports: {} };
new Function('module', readFileSync(SCRIPT, 'utf8'))(module);
const { profile } = module.exports;

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { console.log(`✗ ${name} — ${err.message}`); process.exitCode = 1; }
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const assertEqual = (actual, expected, message) =>
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

const field = (result, path) => result.fields.find((f) => f.path === path);
const findings = (result, kind) => result.findings.filter((f) => f.kind === kind);

const orders = Array.from({ length: 20 }, (_, i) => ({
  orderId: `ORD-${i + 1}`,
  currency: 'GBP',
  status: i === 19 ? 'disputed' : i % 2 ? 'delivered' : 'cancelled',
  amount: i === 4 ? '20.00' : 10 * (i + 1),
  ...(i < 3 ? { refund: 5 } : {}),
}));

test('counts the samples and reports each field', () => {
  const result = profile(orders);
  assertEqual(result.count, 20, 'count');
  assertEqual(result.fields.map((f) => f.path), ['orderId', 'currency', 'status', 'amount', 'refund'], 'paths');
  assertEqual(field(result, 'refund').present, 3, 'refund present');
  assertEqual(field(result, 'amount').types, { number: 19, string: 1 }, 'amount types');
});

test('finds a constant', () => {
  assertEqual(findings(profile(orders), 'constant'), [{ kind: 'constant', path: 'currency', value: 'GBP' }], 'constants');
});

test('finds a key: a different value in every sample', () => {
  assertEqual(findings(profile(orders), 'unique').map((f) => f.path), ['orderId', 'amount'], 'unique');
});

test('finds a field present in some samples only', () => {
  assertEqual(findings(profile(orders), 'sometimes-missing'), [{ kind: 'sometimes-missing', path: 'refund', present: 3, of: 20 }], 'missing');
});

test('finds mixed types, naming the odd samples by position or by id', () => {
  assertEqual(findings(profile(orders), 'mixed-types'), [{ kind: 'mixed-types', path: 'amount', types: { number: 19, string: 1 }, samples: ['#4'] }], 'by position');
  assertEqual(findings(profile(orders, { id: 'orderId' }), 'mixed-types')[0].samples, ['ORD-5'], 'by id');
});

test('finds rare values only among few distinct values', () => {
  assertEqual(findings(profile(orders), 'rare-values'), [{ kind: 'rare-values', path: 'status', values: ['disputed'] }], 'rare');
  const spread = profile(Array.from({ length: 10 }, (_, i) => ({ n: i % 4 })));
  assertEqual(findings(spread, 'rare-values'), [], 'too few of each to call one rare');
});

test('finds nothing constant or unique in too few samples', () => {
  const result = profile(orders.slice(0, 3));
  assertEqual(findings(result, 'constant'), [], 'constant');
  assertEqual(findings(result, 'unique'), [], 'unique');
});

test('orders findings by kind, then by path', () => {
  assertEqual(profile(orders).findings.map((f) => f.kind), ['constant', 'unique', 'unique', 'sometimes-missing', 'mixed-types', 'rare-values'], 'kinds');
});

test('nested objects become dotted paths, parents before children', () => {
  const result = profile([{ a: 1, customer: { name: 'x' } }, { a: 2, customer: { name: 'y', address: { city: 'z' } } }]);
  assertEqual(result.fields.map((f) => f.path), ['a', 'customer', 'customer.name', 'customer.address', 'customer.address.city'], 'paths');
  assertEqual(field(result, 'customer').types, { object: 2 }, 'object type');
});

test('a missing child is counted against its parent, not every sample', () => {
  const result = profile([{ c: { a: 1, b: 1 } }, { c: { a: 1 } }, {}]);
  const missing = findings(result, 'sometimes-missing');
  assertEqual(missing, [
    { kind: 'sometimes-missing', path: 'c', present: 2, of: 3 },
    { kind: 'sometimes-missing', path: 'c.b', present: 1, of: 2 },
  ], 'missing');
});

test('arrays: the array has lengths, its elements are gathered under []', () => {
  const result = profile([{ items: [{ sku: 'a' }, { sku: 'b' }] }, { items: [{ sku: 'a' }] }, { items: [] }]);
  assertEqual(result.fields.map((f) => f.path), ['items', 'items[]', 'items[].sku'], 'paths');
  assertEqual(field(result, 'items').lengths.min, 0, 'shortest');
  assertEqual(field(result, 'items').lengths.max, 2, 'longest');
  assertEqual(field(result, 'items[].sku').present, 2, 'samples with a sku');
  assertEqual(field(result, 'items[].sku').values, [{ value: 'a', count: 2 }, { value: 'b', count: 1 }], 'every element counted');
  assertEqual(findings(result, 'sometimes-missing'), [], 'an empty array leaves nothing missing');
});

test('arrays of plain values are profiled too', () => {
  const result = profile([{ tags: ['x', 'y'] }, { tags: ['x'] }]);
  assertEqual(field(result, 'tags[]').values, [{ value: 'x', count: 2 }, { value: 'y', count: 1 }], 'tags');
});

test('null is a type and a value of its own', () => {
  const result = profile([{ v: null }, { v: 'a' }, { v: null }]);
  assertEqual(field(result, 'v').types, { null: 2, string: 1 }, 'types');
  assertEqual(field(result, 'v').values, [{ value: null, count: 2 }, { value: 'a', count: 1 }], 'values');
});

test('a string and a number that look alike are different values', () => {
  assertEqual(field(profile([{ v: 1 }, { v: '1' }]), 'v').distinct, 2, 'distinct');
});

test('numbers have min, max, mean and a histogram of round bins', () => {
  const numbers = field(profile(Array.from({ length: 100 }, (_, i) => ({ n: i + 1 }))), 'n').numbers;
  assertEqual([numbers.min, numbers.max, numbers.mean], [1, 100, 50.5], 'summary');
  assertEqual(numbers.histogram[0], { from: 0, to: 10, count: 9 }, 'first bin');
  assertEqual(numbers.histogram.length, 11, 'bins');
  assertEqual(numbers.histogram.reduce((sum, bin) => sum + bin.count, 0), 100, 'every number in a bin');
  assertEqual(field(profile([{ n: 0.1 }, { n: 0.3 }]), 'n').numbers.histogram[1], { from: 0.12, to: 0.14, count: 0 }, 'no floating-point dust');
  assertEqual(field(profile([{ n: 3 }, { n: 3 }]), 'n').numbers.histogram, [{ from: 3, to: 3, count: 2 }], 'one value, one bin');
  const whole = field(profile([1, 2, 3, 4, 5, 6].map((n) => ({ n }))), 'n').numbers.histogram;
  assertEqual(whole.map((bin) => bin.from), [1, 2, 3, 4, 5, 6], 'whole numbers, bins at least one wide');
});

test('values are limited, most common first, with how many more', () => {
  const result = profile(Array.from({ length: 30 }, (_, i) => ({ n: i < 5 ? 0 : 35 - i })), { limit: 3 });
  assertEqual(field(result, 'n').values, [{ value: 0, count: 5 }, { value: 6, count: 1 }, { value: 7, count: 1 }], 'top three, ties by value');
  assertEqual(field(result, 'n').more, 23, 'more');
});

test('path picks the records inside each sample', () => {
  const result = profile([{ items: [{ sku: 'a' }, { sku: 'b' }] }, { items: [{ sku: 'c' }] }], { path: 'items' });
  assertEqual(result.count, 3, 'one record per element');
  assertEqual(result.fields.map((f) => f.path), ['sku'], 'paths');
});

test('the same samples always give the same result', () => {
  assertEqual(profile(orders, { id: 'orderId' }), profile(structuredClone(orders), { id: 'orderId' }), 'repeatable');
});

test('a sample that isn\'t an object is a clear error', () => {
  let error;
  try { profile([{ a: 1 }, 3]); } catch (err) { error = err; }
  assert(error && /sample #1 is number/.test(error.message), `error: ${error?.message}`);
});

test('tens of thousands of samples take well under a second', () => {
  const many = Array.from({ length: 20000 }, (_, i) => ({ id: i, status: ['a', 'b', 'c'][i % 3], amount: i / 7, items: [{ sku: `s${i % 300}` }] }));
  const started = Date.now();
  profile(many);
  assert(Date.now() - started < 1000, `took ${Date.now() - started}ms`);
});

test('markdown says each finding in words, findings before fields', () => {
  const text = profile.markdown(profile(orders, { id: 'orderId' }));
  for (const words of ['`currency`: always GBP', '`orderId`: every value different', '`refund`: missing in 85%', '`amount`: 1 is a string (ORD-5)', '`status`: seen once: disputed']) {
    assert(text.includes(words), `missing "${words}" in:\n${text}`);
  }
  assert(text.indexOf('## Findings') < text.indexOf('## Fields'), 'findings first');
});

test('markdown never rounds a gap away', () => {
  const text = profile.markdown(profile([...Array.from({ length: 999 }, () => ({ a: 1, b: 1 })), { a: 1 }]));
  assert(text.includes('missing in under 1%') && text.includes('| over 99% |'), text);
});
