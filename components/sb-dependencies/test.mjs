// Tests for sb-dependencies' core, in Node. Plain assertions, no libraries; run with `node components/sb-dependencies/test.mjs`.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Loaded as tools/analyse.mjs loads it: the script hands its core to `module.exports`.
const SCRIPT = resolve(fileURLToPath(import.meta.url), '../sb-dependencies.js');
const module = { exports: {} };
new Function('module', readFileSync(SCRIPT, 'utf8'))(module);
const { dependencies } = module.exports;

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { console.log(`✗ ${name} — ${err.message}`); process.exitCode = 1; }
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const assertEqual = (actual, expected, message) =>
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

const findings = (result, kind) => result.findings.filter((f) => f.kind === kind);
const rule = (result, from, to) => findings(result, 'determines').find((f) => f.from.join() === from && f.to === to);
const rulesFrom = (result, from) => findings(result, 'determines').filter((f) => f.from.join() === from).map((f) => f.to);

// 100 orders. Country decides currency, and VAT except for three British orders; a product's sku,
// name and price go together, its category follows, and the category's department follows that.
const COUNTRIES = { GB: ['GBP', 0.2], FR: ['EUR', 0.2], DE: ['EUR', 0.19], US: ['USD', 0] };
const PRODUCTS = ['Mug', 'Cup', 'Rake', 'Hoe', 'Kite', 'Ball', 'Lamp', 'Rug', 'Pot', 'Seed'];
const DEPARTMENTS = ['home', 'home', 'garden', 'garden', 'toys'];
const orders = Array.from({ length: 100 }, (_, i) => {
  const country = Object.keys(COUNTRIES)[i % 4];
  const product = Math.floor(i / 10);
  const category = Math.floor(product / 2);
  const returned = i % 5 === 0;
  return {
    orderId: `ORD-${i}`,
    channel: 'web',
    country,
    currency: COUNTRIES[country][0],
    vatRate: [8, 48, 88].includes(i) ? 0.05 : COUNTRIES[country][1],
    sku: `SKU-${product}`,
    productName: PRODUCTS[product],
    unitPrice: 5 + product,
    category: `C${category}`,
    department: DEPARTMENTS[category],
    status: returned ? 'returned' : i % 2 ? 'delivered' : 'shipped',
    slot: Math.floor(i / 2),
    ...(returned ? { refund: 1 + i, refundReason: ['damaged', 'late', 'wrong size'][Math.floor(i / 5) % 3] } : {}),
  };
});

test('finds an exact rule', () => {
  assertEqual(rule(dependencies(orders), 'country', 'currency'), { kind: 'determines', from: ['country'], to: 'currency', holds: 1, of: 100 }, 'rule');
});

test('finds a near-miss, with how strongly it holds and the samples that break it', () => {
  assertEqual(rule(dependencies(orders, { id: 'orderId' }), 'country', 'vatRate'), {
    kind: 'determines', from: ['country'], to: 'vatRate', holds: 0.97, of: 100,
    exceptions: [{ value: { country: 'GB' }, usual: 0.2, odd: [{ value: 0.05, count: 3, samples: ['ORD-8', 'ORD-48', 'ORD-88'] }] }],
  }, 'near-miss');
});

test('names samples by position without an id', () => {
  assertEqual(rule(dependencies(orders), 'country', 'vatRate').exceptions[0].odd[0].samples, ['#8', '#48', '#88'], 'positions');
});

test('reports near-misses only down to the threshold', () => {
  assertEqual(rule(dependencies(orders, { threshold: 0.98 }), 'country', 'vatRate'), undefined, 'below the threshold');
});

test('reports fields that change together once, as a group that stands in for them', () => {
  const result = dependencies(orders);
  assertEqual(findings(result, 'together'), [{ kind: 'together', fields: ['sku', 'productName', 'unitPrice'] }], 'group');
  assertEqual(rulesFrom(result, 'productName'), [], 'no rules from the others in the group');
  assertEqual(rulesFrom(result, 'sku'), ['category', 'department'], 'the first field carries the rules');
});

test('marks a rule that follows from two others with the field it goes via', () => {
  const result = dependencies(orders);
  assertEqual(rule(result, 'sku', 'department').via, 'category', 'implied');
  assertEqual(rule(result, 'sku', 'category').via, undefined, 'direct');
  assertEqual(rule(result, 'category', 'department').via, undefined, 'direct');
});

test('finds optional fields present together', () => {
  assertEqual(findings(dependencies(orders), 'present-together'), [{ kind: 'present-together', fields: ['refund', 'refundReason'], present: 20 }], 'present together');
});

test('skips keys and constants, saying why', () => {
  const result = dependencies(orders);
  assertEqual(result.skipped, [{ path: 'orderId', reason: 'unique' }, { path: 'channel', reason: 'constant' }, { path: 'refund', reason: 'unique' }], 'skipped');
  assert(!result.fields.includes('orderId') && result.fields.includes('country'), 'fields considered');
});

test('a field with too few samples per value determines nothing', () => {
  assertEqual(rulesFrom(dependencies(orders), 'slot'), [], 'two samples per slot, and slots fit within products');
});

test('a nearly constant field isn\'t determined by everything', () => {
  const samples = Array.from({ length: 100 }, (_, i) => ({ a: i % 4, b: i % 5, flag: i === 3 ? 'odd' : 'usual' }));
  assertEqual(findings(dependencies(samples), 'determines'), [], 'guessing "usual" is as good as any rule');
});

test('pairs of fields only when asked, and only where neither alone does', () => {
  const samples = Array.from({ length: 40 }, (_, i) => {
    const region = ['north', 'east', 'south', 'west'][i % 4], tier = Math.floor(i / 4) % 2 ? 'gold' : 'basic';
    return { region, tier, discount: (i % 4) * 10 + (tier === 'gold' ? 5 : 0), zone: i % 4 < 2 ? 'cold' : 'warm' };
  });
  assertEqual(rule(dependencies(samples), 'region,tier', 'discount'), undefined, 'not without pairs');
  const result = dependencies(samples, { pairs: true });
  assertEqual(rule(result, 'region,tier', 'discount'), { kind: 'determines', from: ['region', 'tier'], to: 'discount', holds: 1, of: 40 }, 'pair');
  assert(rule(result, 'region', 'zone'), 'region alone determines zone');
  assertEqual(findings(result, 'determines').filter((f) => f.from.length === 2 && f.to === 'zone'), [], 'so no pair does');
});

test('caps the fields considered, saying so', () => {
  const result = dependencies(orders, { maxFields: 2 });
  assertEqual(result.fields, ['country', 'currency'], 'considered');
  assert(result.skipped.some((s) => s.path === 'vatRate' && s.reason === 'max-fields'), 'over the cap');
});

test('nested objects become dotted paths; arrays are skipped, saying so', () => {
  const samples = Array.from({ length: 10 }, (_, i) => ({ customer: { city: i % 2 ? 'Leeds' : 'York', region: i % 2 ? 'north' : 'south' }, tags: ['x'] }));
  const result = dependencies(samples);
  assertEqual(result.fields, ['customer.city', 'customer.region'], 'paths');
  assertEqual(findings(result, 'together'), [{ kind: 'together', fields: ['customer.city', 'customer.region'] }], 'group');
  assertEqual(result.skipped, [{ path: 'tags', reason: 'array' }], 'skipped');
});

test('path makes each element a sample', () => {
  const samples = [{ items: Array.from({ length: 10 }, (_, i) => ({ sku: `S${i % 2}`, name: `N${i % 2}` })) }, { items: [] }];
  const result = dependencies(samples, { path: 'items' });
  assertEqual(result.count, 10, 'one sample per element');
  assertEqual(findings(result, 'together')[0].fields, ['sku', 'name'], 'group');
});

test('a string and a number that look alike are different values', () => {
  const samples = Array.from({ length: 20 }, (_, i) => ({ a: i % 2 ? 1 : '1', b: i % 2 ? 'x' : 'y' }));
  assertEqual(findings(dependencies(samples), 'together')[0].fields, ['a', 'b'], '1 and "1" tell b apart');
});

test('orders findings: exact rules, near-misses by strength, groups that change together, then present together', () => {
  const kinds = dependencies(orders).findings.map((f) => (f.kind === 'determines' ? (f.holds === 1 ? 'exact' : 'near') : f.kind));
  const firstNear = kinds.indexOf('near');
  assert(kinds.slice(0, firstNear).every((k) => k === 'exact'), `exact first: ${kinds}`);
  assertEqual(kinds.slice(-2), ['together', 'present-together'], 'groups last');
});

test('the same samples always give the same result', () => {
  assertEqual(dependencies(orders, { id: 'orderId' }), dependencies(structuredClone(orders), { id: 'orderId' }), 'repeatable');
});

test('a sample that isn\'t an object is a clear error', () => {
  let error;
  try { dependencies([{ a: 1 }, 3]); } catch (err) { error = err; }
  assert(error && /sample #1 is number/.test(error.message), `error: ${error?.message}`);
});

test('fifty fields over twenty thousand samples take under two seconds', () => {
  const many = Array.from({ length: 20000 }, (_, i) => Object.fromEntries(Array.from({ length: 50 }, (_, f) => [`f${f}`, (i * (f + 1)) % (3 + f * 7)])));
  const started = Date.now();
  dependencies(many);
  assert(Date.now() - started < 2000, `took ${Date.now() - started}ms`);
});

test('markdown leads with near-misses and their exceptions, then rules, then groups', () => {
  const text = dependencies.markdown(dependencies(orders, { id: 'orderId' }));
  for (const words of [
    '`country` determines `vatRate` (holds in 97%: 3 exceptions)',
    'GB usually goes with 0.2, but 0.05 in 3 samples (ORD-8, ORD-48, ORD-88)',
    '`sku` determines `department` (via `category`)',
    '`sku`, `productName`, `unitPrice`',
    '`refund`, `refundReason` (in 20 of 100)',
    '`orderId`: every value different',
  ]) assert(text.includes(words), `missing "${words}" in:\n${text}`);
  const at = (title) => text.indexOf(`## ${title}`);
  assert(at('Near-misses') < at('Rules') && at('Rules') < at('Change together') && at('Change together') < at('Present together'), 'in order');
});

test('markdown never rounds a near-miss up to 100%', () => {
  const samples = Array.from({ length: 2000 }, (_, i) => ({ a: i % 2, b: i === 7 ? 'odd' : i % 2 }));
  assert(dependencies.markdown(dependencies(samples)).includes('holds in 99.9%'), 'never 100%');
});
