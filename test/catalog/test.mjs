// The catalog's Find by need index names every component and engine, and nothing else.
// Plain assertions, no libraries.

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { console.log(`✗ ${name} — ${err.message}`); process.exitCode = 1; }
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };

// Hidden entries, such as macOS's .DS_Store, are never components.
const folders = (kind) => readdirSync(join(ROOT, kind)).filter((name) => !name.startsWith('.'));
const available = [...folders('components'), ...folders('engines')];

// The names after each line's arrow, such as "- A need → `sb-chart`, `sb-graph`".
function namesInFindByNeed() {
  const section = readFileSync(join(ROOT, 'CATALOG.md'), 'utf8').match(/^## Find by need\n([\s\S]*?)^## /m)?.[1];
  assert(section, 'CATALOG.md has no Find by need section');
  const served = section.split('\n').filter((line) => line.startsWith('- ')).map((line) => line.split('→')[1] ?? '');
  return served.flatMap((names) => [...names.matchAll(/`([^`]+)`/g)].map((match) => match[1]));
}

test('every component and engine serves at least one need', () => {
  const named = new Set(namesInFindByNeed());
  const missing = available.filter((name) => !named.has(name));
  assert(!missing.length, `not in Find by need: ${missing.join(', ')}`);
});

test('every name in Find by need is a component or engine', () => {
  const unknown = namesInFindByNeed().filter((name) => !available.includes(name));
  assert(!unknown.length, `no such component or engine: ${unknown.join(', ')}`);
});
