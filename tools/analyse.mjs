#!/usr/bin/env node
// Runs a component's analysis on data files, without a page. No dependencies: just Node.
//
//   node tools/analyse.mjs profile data/*.json
//   node tools/analyse.mjs profile orders.jsonl --path items --md
//   node tools/analyse.mjs list
//
// - The first argument names the analysis: a function in a component's core. `list` shows them all.
// - Inputs are JSON files (one sample, or an array of samples), JSON Lines files, or folders of
//   them. Samples are joined in the order given, a folder's files in name order.
// - Writes compact JSON by default; --md writes a short summary, if the analysis has one. Findings come first.
// - Other options pass to the analysis: `--limit 20` becomes { limit: 20 }. Numbers become numbers.
//   Options the analysis names in its `flags` take no value: `--pairs` becomes { pairs: true }.
//
// A component has a core when its script sets `module.exports`. Scripts are run with `new Function`
// rather than `require`, so they load the same wherever this clone sits, whatever a package.json
// above it says.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const COMPONENTS = resolve(fileURLToPath(import.meta.url), '../../components');

// Every analysis by name, with the component it comes from.
function analyses() {
  return readdirSync(COMPONENTS).filter((name) => !name.startsWith('.')).flatMap((component) => {
    const script = join(COMPONENTS, component, `${component}.js`);
    const source = readFileSync(script, 'utf8');
    if (!source.includes('module.exports')) return [];
    const module = { exports: {} };
    new Function('module', source)(module);
    return Object.entries(module.exports).map(([name, run]) => ({ name, run, component, about: aboutOf(source) }));
  });
}

// The first sentence of the script's header, after the line naming it.
function aboutOf(source) {
  const lines = source.split('\n').slice(1);
  const header = lines.slice(0, lines.findIndex((line) => !line.startsWith('// ') || line === '//'));
  return header.map((line) => line.slice(3)).join(' ').split(/(?<=\.) /)[0];
}

function list() {
  for (const { name, component, about } of analyses()) console.log(`${name.padEnd(12)} ${component.padEnd(14)} ${about}`);
}

function readSamples(path) {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).filter((name) => /\.jsonl?$/.test(name)).sort().flatMap((name) => readSamples(join(path, name)));
  }
  const text = readFileSync(path, 'utf8');
  if (path.endsWith('.jsonl')) {
    return text.split('\n').flatMap((line, i) => (line.trim() ? [parse(line, `${path}, line ${i + 1}`)] : []));
  }
  const value = parse(text, path);
  return Array.isArray(value) ? value : [value];
}

function parse(text, where) {
  try {
    return JSON.parse(text);
  } catch (err) {
    fail(`${where} isn't valid JSON: ${err.message}`);
  }
}

// Splits the arguments into inputs and options: `--md` and the analysis's flags alone, every other option with a value.
function parseArgs(args, flags = []) {
  const inputs = [], options = {};
  let md = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--md') md = true;
    else if (flags.includes(args[i].slice(2))) options[args[i].slice(2)] = true;
    else if (args[i].startsWith('--')) {
      const value = args[++i];
      if (value === undefined) fail(`${args[i - 1]} needs a value.`);
      options[args[i - 1].slice(2)] = value.trim() !== '' && !isNaN(value) ? Number(value) : value;
    } else inputs.push(args[i]);
  }
  return { inputs, options, md };
}

function analyse(name, args) {
  const available = analyses();
  const analysis = available.find((a) => a.name === name);
  if (!analysis) fail(`There's no analysis called "${name}". Available: ${available.map((a) => a.name).join(', ')}.`);
  const { inputs, options, md } = parseArgs(args, analysis.run.flags);
  if (!inputs.length) fail(`Name the files or folders to analyse: node tools/analyse.mjs ${name} <file or folder ...>`);

  const samples = inputs.flatMap(readSamples);
  let result;
  try {
    result = analysis.run(samples, options);
  } catch (err) {
    fail(err.message);
  }
  if (md && !analysis.run.markdown) fail(`${name} has no summary; leave out --md for JSON.`);
  process.stdout.write(md ? analysis.run.markdown(result) : `${JSON.stringify(result)}\n`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (!command) fail('Usage: node tools/analyse.mjs <analysis> <file or folder ...> [--md] [--option value ...]\n       node tools/analyse.mjs list');
if (command === 'list') list();
else analyse(command, args);
