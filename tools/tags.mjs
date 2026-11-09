#!/usr/bin/env node
// Reads a sandbox's tags and what carries them, and either reports how well they work as a map, or
// searches for what carries some of them. No dependencies: just Node, and the tags engine beside this tool.
//
//   node tools/tags.mjs report path/to/sandbox
//   node tools/tags.mjs search path/to/sandbox platform-changes passengers --without announcements
//   node tools/tags.mjs search path/to/sandbox --any delays cancellations --limit 10 --from 11
//   node tools/tags.mjs search path/to/sandbox --preset "Platform changes passengers raised"
//   node tools/tags.mjs search path/to/sandbox --like CLM-4 DEC-1
//
// - Reads the declared tags and presets (records/tags.js or tags.js), the catalogue's sources, every list in
//   records/ and the model's ITEMS. The tags engine applies tagging's rules: working tags and anything
//   superseded are left out, and retired tags are followed.
// - report says how far tags reach and how well they narrow, then lists only what's worth a look: gaps,
//   tags too broad or too narrow, crowded places, tags that overlap, and items to spot-check.
// - search lists what carries a selection, or what's like some items, one line each with its score, then
//   the ways to narrow or widen. Never the records themselves: read the ones worth reading. A page of
//   results at a time: when there are more, the first line says which are shown and the last how to go on.
//
// It reports and never judges: skew can be right for a subject, and it can't tell whether a tag fits
// what it's on. So it has no pass mark, finding nothing is an answer, and it exits with status 1 only
// if it can't run.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { createTags } = require('../engines/tags/tags.js');

const MIN_ITEMS_FOR_SHARES = 10;
const BROAD_SHARE = 0.4;
const CROWDED_SHARE = 0.1;
const CROWDED_MIN = 5;
const OVERLAP_SHARE = 0.8;
const OVERLAP_MIN = 3;
const MAX_LISTED = 5;
const SPOT_CHECKS = 3;
const FIND_LIMIT = 20;
const LABEL_LENGTH = 70;

function report(folder) {
  const { notes, declared, presets, lists } = readSandbox(folder);
  const items = createTags({ lists, tags: declared }).items().map(({ id, tags }) => ({ id, tags: Array.isArray(tags) ? tags : [] }));
  const tagged = items.filter((item) => item.tags.length);
  if (!declared.length && !tagged.length) return [...notes, 'No tags here. Tagging is opt-in: see the tagging practice.'];

  const map = { items, tagged, declared, presets, carriers: carriersOf(tagged), places: placesOf(tagged) };
  return [...notes, ...headlines(map), '', ...findings(map)];
}

// ---- Reading ----

// Everything both commands read: the declarations, the presets, and every list of items by name,
// which gives their kind: SOURCES holds sources, ITEMS the model's items.
function readSandbox(folder) {
  const sandbox = resolve(folder);
  const notes = [];
  const records = readRecords(sandbox, notes);
  return {
    notes,
    declared: readDeclared(sandbox, records, notes),
    presets: readPresets(sandbox, records, notes),
    lists: { SOURCES: readSources(sandbox), ...itemLists(records), ITEMS: readModelItems(sandbox, notes) }
  };
}

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

function readPresets(sandbox, records, notes) {
  if (records.TAG_PRESETS) return records.TAG_PRESETS;
  return existsSync(join(sandbox, 'tags.js')) ? readScript(sandbox, 'tags.js', notes).TAG_PRESETS ?? [] : [];
}

// A preset names tags, so one can be left behind when a tag is retired or renamed.
function stalePresets(presets, declared) {
  const current = new Set(declared.filter(({ replacedBy }) => !replacedBy).map(({ tag }) => tag));
  return presets.flatMap(({ name, tags = [], without = [] }) => {
    const stale = [...tags, ...without].filter((tag) => !current.has(tag));
    return stale.length ? [`Preset "${name}" names ${stale.join(', ')}, which ${stale.length === 1 ? "isn't a current tag" : "aren't current tags"}.`] : [];
  });
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

// Every list in records/ but the tags' own.
const NOT_ITEMS = ['TAGS', 'TAG_PRESETS'];
const itemLists = (records) => Object.fromEntries(Object.entries(records).filter(([name]) => !NOT_ITEMS.includes(name)));

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
  const { items, tagged, declared, presets, carriers, places } = map;
  const inUse = (tag) => carriers.has(tag);
  const names = new Set(declared.map(({ tag }) => tag));
  const retired = declared.filter(({ replacedBy }) => replacedBy);
  const broad = broadTags(map);
  const overlapping = overlaps(map);
  const crowded = tagged.length < MIN_ITEMS_FOR_SHARES ? [] : [...places].filter(([, count]) => count >= CROWDED_MIN && count / tagged.length >= CROWDED_SHARE);

  const found = [
    ...listed('Untagged', items.filter(({ tags }) => !tags.length).map(({ id }) => id)),
    ...listed('In use but never declared', [...carriers.keys()].filter((tag) => !names.has(tag))),
    ...stalePresets(presets, declared),
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

// ---- Searching ----

function search(folder, args) {
  const { notes, declared, presets, lists } = readSandbox(folder);
  const engine = createTags({ lists, tags: declared });
  const asked = askedIn(args, presets);
  if (asked.like.length) return [...notes, ...likeLines(engine, asked)];
  const { results: ranked, total, exact, selection, followed, undeclared } = engine.find(asked.selection);
  const results = pageOf(ranked, asked);
  const { narrow, widen } = engine.ways(selection);
  const { tags, match, without } = selection;
  const what = `${tags.join(match === 'any' ? ' or ' : ' + ') || 'any tag'}${without.length ? `, without ${without.join(', ')}` : ''}`;
  return [
    ...notes,
    total ? `${counted(total, 'item')} ${total === 1 ? 'carries' : 'carry'} ${what}${showing(total, asked)}.${exactly(exact)}` : `Nothing carries ${what}.`,
    ...results.map((result) => resultLine(result, result.lacks.length && `lacks ${result.lacks.join(', ')}`)),
    ...moreLine(total, asked),
    ...(narrow.length ? [`Narrow: ${narrow.map(wayWords).join(' · ')}`] : []),
    ...(widen.length ? [`Widen: ${widen.map(wayWords).join(' · ')}`] : []),
    ...followed.map(({ from, to }) => `Followed: ${from} → ${to.join(', ') || 'nothing (retired)'}.`),
    ...(undeclared.length ? [`Never declared: ${undeclared.join(', ')}.`] : [])
  ];
}

function likeLines(engine, asked) {
  const { like } = asked;
  const { results: ranked, total, unknown } = engine.like(like);
  const results = pageOf(ranked, asked);
  const several = like.length - unknown.length > 1;
  return [
    total ? `${counted(total, 'item')} ${total === 1 ? 'shares' : 'share'} tags with ${like.join(', ')}, closest first${showing(total, asked)}.` : `Nothing shares tags with ${like.join(', ')}.`,
    ...results.map((result) => resultLine(result, `shares ${result.shares.join(', ')}${several ? ` with ${result.closest}` : ''}`)),
    ...moreLine(total, asked),
    ...(unknown.length ? [`Not found: ${unknown.join(', ')}.`] : [])
  ];
}

// What the command line asks: tags, then --any, --without, --preset, --like, --limit and --from in any order.
function askedIn(args, presets) {
  const selection = { tags: [], match: 'all', without: [] }, like = [];
  let into = selection.tags, limit = FIND_LIMIT, from = 1;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--any' || arg === '--all') { selection.match = arg.slice(2); into = selection.tags; }
    else if (arg === '--without') into = selection.without;
    else if (arg === '--like') into = like;
    else if (arg === '--preset') usePreset(selection, presets, args[++i]);
    else if (arg === '--limit') limit = Number(args[++i]);
    else if (arg === '--from') from = Number(args[++i]);
    else if (arg.startsWith('--')) fail(`search doesn't know ${arg}.\n${USAGE}`);
    else into.push(arg);
  }
  if (!Number.isInteger(limit) || limit < 1) fail(`--limit needs a whole number above 0.\n${USAGE}`);
  if (!Number.isInteger(from) || from < 1) fail(`--from needs a whole number above 0.\n${USAGE}`);
  if (!selection.tags.length && !selection.without.length && !like.length) fail(`search needs tags, a preset or --like.\n${USAGE}`);
  return { selection, like, limit, from };
}

function usePreset(selection, presets, name) {
  const preset = presets.find((p) => p.name === name);
  if (!preset) fail(`There's no preset called "${name}".${presets.length ? ` The presets are: ${presets.map((p) => `"${p.name}"`).join(', ')}.` : ''}`);
  selection.tags.push(...(preset.tags ?? []));
  selection.without.push(...(preset.without ?? []));
  if (preset.match) selection.match = preset.match;
}

// Several scoring 1.00 in a row would read as a fault, so the first line says why.
const exactly = (exact) => (exact > 1 ? ` ${exact} carry exactly these and no other tag, so they score 1.00, in code order.` : '');

// One line per result: score, id, kind (and status, where the record says it), a short label, and the tags.
function resultLine({ score, id, kind, label, item }, tags) {
  const short = label.length > LABEL_LENGTH ? `${label.slice(0, LABEL_LENGTH - 1).trimEnd()}…` : label;
  const status = typeof item.status === 'string' ? `, ${item.status}` : '';
  return [`${score.toFixed(2)} ${id} ${kind ?? 'item'}${status}`, short, tags].filter(Boolean).join(' · ');
}

// A page of results, counted from 1. A cut-short list always says so: which are shown, and how to go on.
const pageOf = (results, { from, limit }) => results.slice(from - 1, from - 1 + limit);
const lastShown = (total, { from, limit }) => Math.min(total, from - 1 + limit);
function showing(total, asked) {
  if (asked.from > total) return ` (showing none: there are only ${total})`;
  return asked.from > 1 || lastShown(total, asked) < total ? ` (showing ${asked.from}–${lastShown(total, asked)})` : '';
}
function moreLine(total, asked) {
  const last = lastShown(total, asked), left = total - last;
  const keep = asked.limit === FIND_LIMIT ? '' : ` --limit ${asked.limit}`;
  return left > 0 && asked.from <= total ? [`${left} more: --from ${last + 1}${keep} for the next ${Math.min(left, asked.limit)}.`] : [];
}
const wayWords = ({ add, drop, match, count }) => `${add ? `+${add}` : drop ? `drop ${drop}` : match} ${count}`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

const USAGE = [
  'Usage: node tools/tags.mjs report <sandbox-folder>',
  '       node tools/tags.mjs search <sandbox-folder> [tag …] [--any] [--without tag …] [--preset "name"] [--like id …] [--limit n] [--from n]'
].join('\n');

const [command, folder, ...args] = process.argv.slice(2);
if (!['report', 'search'].includes(command) || !folder) fail(USAGE);
if (!existsSync(folder)) fail(`There's no folder at ${folder}.`);
console.log((command === 'report' ? report(folder) : search(folder, args)).join('\n'));
