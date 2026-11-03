// The catalog's Find by need index names every component, engine and mechanism, and nothing else.
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

// Folders only, and never hidden ones, so .gitkeep, .DS_Store or a stray file never counts as a part.
const folders = (kind) => readdirSync(join(ROOT, kind), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).map((entry) => entry.name);
const available = [...folders('components'), ...folders('engines'), ...folders('mechanisms')];

// The names after each line's arrow, such as "- A need → `sb-chart`, `sb-graph`".
function namesInFindByNeed() {
  const section = readFileSync(join(ROOT, 'CATALOG.md'), 'utf8').match(/^## Find by need\n([\s\S]*?)^## /m)?.[1];
  assert(section, 'CATALOG.md has no Find by need section');
  const served = section.split('\n').filter((line) => line.startsWith('- ')).map((line) => line.split('→')[1] ?? '');
  return served.flatMap((names) => [...names.matchAll(/`([^`]+)`/g)].map((match) => match[1]));
}

test('every component, engine and mechanism serves at least one need', () => {
  const named = new Set(namesInFindByNeed());
  const missing = available.filter((name) => !named.has(name));
  assert(!missing.length, `not in Find by need: ${missing.join(', ')}`);
});

test('every name in Find by need is a component, engine or mechanism', () => {
  const unknown = namesInFindByNeed().filter((name) => !available.includes(name));
  assert(!unknown.length, `no such component, engine or mechanism: ${unknown.join(', ')}`);
});
