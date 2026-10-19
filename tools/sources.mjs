#!/usr/bin/env node
// Checks a sandbox's source material against its catalogue and its model. No dependencies: just Node.
//
//   node tools/sources.mjs check path/to/sandbox
//
// - The catalogue (sources/catalogue.json) is valid, its ids unique, and every path exists.
// - Every file in sources/, outside the inbox, is catalogued.
// - Every citation in the model's ITEMS names a catalogued source, and its quote is in the file
//   (whitespace and case aside). Quotes in PDFs and images can't be read, so they're noted as not checked.
// - respondsTo, derivedFrom, supersedes and restsOn point at things that exist.
// - Items citing nothing, and files waiting in the inbox, are noted rather than failed.
//
// Lists every error and note, and exits with status 1 if there are errors.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, relative, resolve, sep } from 'node:path';

const CATALOGUE = 'sources/catalogue.json';
const INBOX = 'sources/inbox';
const UNREADABLE = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

function check(folder) {
  const sandbox = resolve(folder);
  const errors = [];
  const notes = [];
  const sources = readCatalogue(sandbox, errors);
  const byId = new Map(sources.map((source) => [source.id, source]));

  checkSources(sandbox, sources, byId, errors);
  checkUncatalogued(sandbox, sources, errors, notes);
  const items = readItems(sandbox, notes);
  if (items) checkItems(sandbox, items, byId, errors, notes);
  return { errors, notes };
}

function readCatalogue(sandbox, errors) {
  const file = join(sandbox, CATALOGUE);
  if (!existsSync(file)) return errors.push(`There's no ${CATALOGUE}.`), [];
  let catalogue;
  try {
    catalogue = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    return errors.push(`${CATALOGUE} isn't valid JSON: ${err.message}`), [];
  }
  if (catalogue.format !== 'sandkit-sources' || !Array.isArray(catalogue.sources)) {
    return errors.push(`${CATALOGUE} should have "format": "sandkit-sources" and a "sources" list.`), [];
  }
  return catalogue.sources;
}

function checkSources(sandbox, sources, byId, errors) {
  const seen = new Set();
  for (const source of sources) {
    const name = source.id ?? source.path ?? 'A source';
    if (!source.id) errors.push(`${name} has no id.`);
    else if (seen.has(source.id)) errors.push(`${source.id} is used by more than one source.`);
    seen.add(source.id);
    if (!source.path) errors.push(`${name} has no path.`);
    else if (!existsSync(join(sandbox, source.path))) errors.push(`${name}'s file is missing: ${source.path}`);
    for (const [field, ids] of Object.entries(linksOf(source))) {
      for (const id of ids) if (!byId.has(id)) errors.push(`${name}'s ${field} names ${id}, which isn't in the catalogue.`);
    }
  }
}

// The other sources a source points at, by field.
const linksOf = (source) => ({
  respondsTo: [source.respondsTo].filter(Boolean),
  derivedFrom: source.derivedFrom ?? [],
  supersedes: [source.supersedes].filter(Boolean)
});

function checkUncatalogued(sandbox, sources, errors, notes) {
  const catalogued = new Set(sources.map((source) => source.path));
  const files = filesUnder(sandbox, join(sandbox, 'sources'));
  const waiting = files.filter((path) => path.startsWith(`${INBOX}/`));
  for (const path of files) {
    if (path !== CATALOGUE && !waiting.includes(path) && !catalogued.has(path)) errors.push(`${path} isn't in the catalogue.`);
  }
  if (waiting.length) notes.push(`${waiting.length} ${waiting.length === 1 ? 'file waits' : 'files wait'} in the inbox to be catalogued.`);
}

// Every file under a folder, as a path from the sandbox, hidden files left out.
const filesUnder = (sandbox, dir) => !existsSync(dir) ? [] : readdirSync(dir, { withFileTypes: true })
  .filter((entry) => !entry.name.startsWith('.'))
  .flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(sandbox, path) : [relative(sandbox, path).split(sep).join('/')];
  });

// The model's ITEMS, run as the model's own tests would load it. Null when there are none to check.
function readItems(sandbox, notes) {
  const file = join(sandbox, 'model.js');
  if (!existsSync(file)) return notes.push('There\'s no model.js, so no citations were checked.'), null;
  const module = { exports: {} };
  try {
    new Function('module', 'exports', 'require', readFileSync(file, 'utf8'))(module, module.exports, createRequire(file));
  } catch (err) {
    return notes.push(`model.js couldn't be loaded in Node (${err.message}), so no citations were checked.`), null;
  }
  const items = module.exports.ITEMS;
  if (!Array.isArray(items)) return notes.push('model.js exports no ITEMS, so no citations were checked.'), null;
  return items;
}

function checkItems(sandbox, items, byId, errors, notes) {
  const ids = new Set(items.map((item) => item.id));
  for (const item of items) {
    const citations = item.sources ?? [];
    for (const id of item.restsOn ?? []) if (!ids.has(id)) errors.push(`${item.id} rests on ${id}, which isn't in ITEMS.`);
    if (!citations.length && !(item.restsOn ?? []).length) notes.push(`${item.id} cites no source.`);
    for (const citation of citations) {
      const source = byId.get(citation.source);
      if (!source) errors.push(`${item.id} cites ${citation.source}, which isn't in the catalogue.`);
      else if (source.path && existsSync(join(sandbox, source.path))) checkCitation(sandbox, item, citation, source, errors, notes);
    }
  }
}

function checkCitation(sandbox, item, citation, source, errors, notes) {
  const file = join(sandbox, source.path);
  if (citation.annotation != null) {
    const annotations = readJson(file)?.annotations ?? [];
    if (!annotations.some((a) => a.n === citation.annotation)) errors.push(`${item.id} cites annotation ${citation.annotation} of ${source.id}, which has none by that number.`);
  } else if (citation.quote != null) {
    if (UNREADABLE.includes(extname(file).toLowerCase())) notes.push(`${item.id}'s quote in ${source.id} is not checked (${extname(file).slice(1)}).`);
    else if (!normalise(readFileSync(file, 'utf8')).includes(normalise(citation.quote))) errors.push(`${item.id} quotes ${source.id}, but the quote isn't in it: "${citation.quote}"`);
  }
}

function readJson(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

const normalise = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

function fail(message) {
  console.error(message);
  process.exit(1);
}

const [command, folder] = process.argv.slice(2);
if (command !== 'check' || !folder) fail('Usage: node tools/sources.mjs check <sandbox-folder>');
if (!existsSync(folder)) fail(`There's no folder at ${folder}.`);
const { errors, notes } = check(folder);
for (const error of errors) console.log(`✗ ${error}`);
for (const note of notes) console.log(`· ${note}`);
console.log(errors.length ? `${errors.length} ${errors.length === 1 ? 'error' : 'errors'}.` : 'The sources check out.');
if (errors.length) process.exitCode = 1;
