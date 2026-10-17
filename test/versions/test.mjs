// Every version is stated once in a changelog and repeated in its scripts' first lines.
// These tests keep the two in agreement. Plain assertions, no libraries.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { console.log(`✗ ${name} — ${err.message}`); process.exitCode = 1; }
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

function releases(path) {
  return [...read(path).matchAll(/^## (\S+) · (\S+)$/gm)].map(([, version, date]) => ({ version, date }));
}

const headerVersion = (path) => read(path).match(/^\/\/ Sandkit \S+ (\S+) · MIT Licence/)?.[1];
const isSemver = (v) => /^\d+\.\d+\.\d+$/.test(v);
const newerFirst = (list) => list.every((r, i) => i === 0 || r.version.localeCompare(list[i - 1].version, undefined, { numeric: true }) < 0);

function checkChangelog(path) {
  assert(existsSync(join(ROOT, path)), `${path} is missing`);
  const list = releases(path);
  assert(list.length, `${path} has no releases`);
  list.forEach((r) => assert(isSemver(r.version) && /^\d{4}-\d{2}-\d{2}$/.test(r.date), `${path}: "${r.version} · ${r.date}" isn't "x.y.z · yyyy-mm-dd"`));
  assert(newerFirst(list), `${path}: releases should be newest first`);
  return list[0].version;
}

// Hidden entries, such as macOS's .DS_Store, are never components.
for (const name of readdirSync(join(ROOT, 'components')).filter((name) => !name.startsWith('.'))) {
  test(`${name}: its script states its changelog's latest version`, () => {
    const version = checkChangelog(`components/${name}/CHANGELOG.md`);
    assert(headerVersion(`components/${name}/${name}.js`) === version, `header says ${headerVersion(`components/${name}/${name}.js`)}, changelog says ${version}`);
  });
}

test('shell: both scripts state its changelog\'s latest version', () => {
  const version = checkChangelog('shell/CHANGELOG.md');
  for (const script of ['shell/sb-shell.js', 'shell/sb-theme-settings.js']) {
    assert(headerVersion(script) === version, `${script} says ${headerVersion(script)}, changelog says ${version}`);
  }
});

test('Sandkit has a changelog of its own', () => {
  checkChangelog('CHANGELOG.md');
});
