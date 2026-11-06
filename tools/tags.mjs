#!/usr/bin/env node
// Reports how well a sandbox's tags work as a map of its material. No dependencies: just Node.
//
//   node tools/tags.mjs report path/to/sandbox
//
// - Reads the declared tags (records/tags.js or tags.js), the catalogue's sources, every list in
//   records/ and the model's ITEMS. Working tags and anything superseded are left out.
// - Says how far tags reach and how well they narrow, then lists only what's worth a look: gaps,
//   tags too broad or too narrow, crowded places, tags that overlap, and items to spot-check.
//
// It reports and never judges: skew can be right for a subject, and it can't tell whether a tag fits
// what it's on. So it has no pass mark, and exits with status 1 only if it can't run.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const MIN_ITEMS_FOR_SHARES = 10;
const BROAD_SHARE = 0.4;
const CROWDED_SHARE = 0.1;
const CROWDED_MIN = 5;
const OVERLAP_SHARE = 0.8;
const OVERLAP_MIN = 3;
const MAX_LISTED = 5;
const SPOT_CHECKS = 3;

function report(folder) {
  const sandbox = resolve(folder);
  const notes = [];
  const records = readRecords(sandbox, notes);
  const declared = readDeclared(sandbox, records, notes);
  const items = current([...readSources(sandbox), ...recordItems(records), ...readModelItems(sandbox, notes)]);
  const tagged = items.filter((item) => item.tags.length);
  if (!declared.length && !tagged.length) return [...notes, 'No tags here. Tagging is opt-in: see the tagging practice.'];

  const map = { items, tagged, declared, carriers: carriersOf(tagged), places: placesOf(tagged) };
  return [...notes, ...headlines(map), '', ...findings(map)];
}

// ---- Reading ----

// Every top-level const in each script in records/, by name.
function readRecords(sandbox, notes) {
  const dir = join(sandbox, 'records');
  if (!existsSync(dir)) return {};
  const scripts = readdirSync(dir).filter((file) => file.endsWith('.js')).map((file) => join('records', file));
  return Object.assign({}, ...scripts.map((script) => readScript(sandbox, script, notes)));
}

function readScript(sandbox, script, notes) {
  const source = readFileSync(join(sandbox, script), 'utf8');
  const names = [...source.matchAll(/^const (\w+) =/gm)].map(([, name]) => name);
  try {
    return new Function(`${source}\nreturn { ${names.join(', ')} };`)();
  } catch (err) {
    notes.push(`${script} couldn't be read (${err.message}), so it's left out.`);
    return {};
  }
}

function readDeclared(sandbox, records, notes) {
  if (records.TAGS) return records.TAGS;
  return existsSync(join(sandbox, 'tags.js')) ? readScript(sandbox, 'tags.js', notes).TAGS ?? [] : [];
}

function readSources(sandbox) {
  const file = join(sandbox, 'sources/catalogue.json');
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, 'utf8')).sources ?? [];
  } catch {
    return [];
  }
}

const recordItems = (records) => Object.values(records).filter(Array.isArray).flat();

function readModelItems(sandbox, notes) {
  const file = join(sandbox, 'model.js');
  if (!existsSync(file)) return [];
  const module = { exports: {} };
  try {
    new Function('module', 'exports', 'require', readFileSync(file, 'utf8'))(module, module.exports, createRequire(file));
  } catch (err) {
    notes.push(`model.js couldn't be loaded in Node (${err.message}), so its ITEMS are left out.`);
  }
  return Array.isArray(module.exports.ITEMS) ? module.exports.ITEMS : [];
}

// What a person can still be sent to: one item per id, without whatever has been superseded.
function current(all) {
  const items = all.filter((item) => typeof item?.id === 'string');
  const superseded = new Set(items.map((item) => item.supersedes).filter(Boolean));
  const unique = new Map(items.map((item) => [item.id, item]));
  return [...unique.values()]
    .filter((item) => !superseded.has(item.id) && item.status !== 'superseded')
    .map(({ id, tags }) => ({ id, tags: tags ?? [] }));
}

// ---- Working it out ----

// Each tag in use, with the ids carrying it, most carried first.
function carriersOf(tagged) {
  const carriers = new Map();
  for (const { id, tags } of tagged) for (const tag of tags) carriers.set(tag, [...(carriers.get(tag) ?? []), id]);
  return new Map([...carriers].sort(([, a], [, b]) => b.length - a.length));
}

const placeOf = (item) => [...item.tags].sort().join(' + ');

// Each distinct combination of tags, with how many items sit there, most crowded first.
function placesOf(tagged) {
  const places = new Map();
  for (const item of tagged) places.set(placeOf(item), (places.get(placeOf(item)) ?? 0) + 1);
  return new Map([...places].sort(([, a], [, b]) => b - a));
}

function overlaps({ carriers }) {
  const pairs = [];
  for (const [narrower, narrowerIds] of carriers) {
    if (narrowerIds.length < OVERLAP_MIN) continue;
    for (const [broader, broaderIds] of carriers) {
      if (broader === narrower || broaderIds.length < narrowerIds.length) continue;
      if (broaderIds.length === narrowerIds.length && broader > narrower) continue;
      const shared = narrowerIds.filter((id) => broaderIds.includes(id)).length;
      if (shared / narrowerIds.length >= OVERLAP_SHARE) pairs.push({ narrower, broader, shared, total: narrowerIds.length });
    }
  }
  return pairs.sort((a, b) => b.shared / b.total - a.shared / a.total);
}

const broadTags = ({ items, carriers }) => items.length < MIN_ITEMS_FOR_SHARES ? []
  : [...carriers].filter(([, ids]) => ids.length / items.length >= BROAD_SHARE).map(([tag]) => tag);

const average = (numbers) => numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
const counted = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;
const percent = (part, whole) => `${Math.round(100 * part / whole)}%`;

// ---- Writing it out ----

function headlines({ items, tagged, carriers, places }) {
  const lines = [
    `${counted(items.length, 'item')}, ${counted(carriers.size, 'tag')} in use, ${counted(places.size, 'place')} (distinct combinations of tags).`,
    `Tagged: ${tagged.length} of ${items.length} (${percent(tagged.length, items.length)}).`,
  ];
  if (!tagged.length) return lines;
  const bySingleTag = tagged.map(({ tags }) => Math.min(...tags.map((tag) => carriers.get(tag).length)));
  const byPlace = tagged.map((item) => places.get(placeOf(item)));
  return [...lines,
    `Tags per item: ${average(tagged.map(({ tags }) => tags.length)).toFixed(1)} on average.`,
    `Narrowing: an item's most selective tag leaves ${average(bySingleTag).toFixed(1)} results on average, and its exact combination ${average(byPlace).toFixed(1)}.`,
  ];
}

function findings(map) {
  const { items, tagged, declared, carriers, places } = map;
  const inUse = (tag) => carriers.has(tag);
  const names = new Set(declared.map(({ tag }) => tag));
  const retired = declared.filter(({ replacedBy }) => replacedBy);
  const broad = broadTags(map);
  const overlapping = overlaps(map);
  const crowded = tagged.length < MIN_ITEMS_FOR_SHARES ? [] : [...places].filter(([, count]) => count >= CROWDED_MIN && count / tagged.length >= CROWDED_SHARE);

  const found = [
    ...listed('Untagged', items.filter(({ tags }) => !tags.length).map(({ id }) => id)),
    ...listed('In use but never declared', [...carriers.keys()].filter((tag) => !names.has(tag))),
    ...listed('Retired but still carried', retired.filter(({ tag }) => inUse(tag)).map(({ tag }) => tag)),
    ...listed('Declared but unused', declared.filter(({ tag, replacedBy }) => !replacedBy && !inUse(tag)).map(({ tag }) => tag)),
    ...listed('On one item, so it finds nothing its code wouldn\'t', [...carriers].filter(([, ids]) => ids.length === 1).map(([tag]) => tag)),
    ...broad.map((tag) => `On many items: ${tag} is on ${carriers.get(tag).length} of ${items.length} (${percent(carriers.get(tag).length, items.length)}). It may be too broad to separate much, or the sandbox may simply be about this.`),
    ...crowded.map(([place, count]) => `Crowded place: ${count} items carry exactly ${place}. Another tag might separate them.`),
    ...overlapping.map(({ narrower, broader, shared, total }) => `Overlap: ${shared} of the ${total} items on ${narrower} also carry ${broader}. One tag may do, or one may sit inside the other.`),
  ];
  if (!found.length) return ['Nothing stands out.'];

  const toCheck = [...new Set([...broad, ...overlapping.map(({ narrower }) => narrower)])];
  return [
    'Worth a look. These are only indications, so read the content before changing anything.',
    ...found.map((finding) => `· ${finding}`),
    ...(toCheck.length ? ['', 'Spot-check whether the tag fits what it\'s on:', ...toCheck.map((tag) => `· ${tag}: ${spread(carriers.get(tag)).join(', ')}`)] : []),
  ];
}

function listed(label, things) {
  if (!things.length) return [];
  const more = things.length - MAX_LISTED;
  return [`${label} (${things.length}): ${things.slice(0, MAX_LISTED).join(', ')}${more > 0 ? `, and ${more} more` : ''}.`];
}

// A few ids from across a list, the same ones each run.
function spread(ids) {
  if (ids.length <= SPOT_CHECKS) return ids;
  return Array.from({ length: SPOT_CHECKS }, (_, index) => ids[Math.floor(index * ids.length / SPOT_CHECKS)]);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const [command, folder] = process.argv.slice(2);
if (command !== 'report' || !folder) fail('Usage: node tools/tags.mjs report <sandbox-folder>');
if (!existsSync(folder)) fail(`There's no folder at ${folder}.`);
console.log(report(folder).join('\n'));
