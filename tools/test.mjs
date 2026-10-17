// Tests for the tools. Plain assertions, no libraries; run with `node tools/test.mjs`.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SETUP = resolve(fileURLToPath(import.meta.url), '../setup.mjs');

function test(name, fn) {
  const sandbox = mkdtempSync(join(tmpdir(), 'sandkit-sandbox-'));
  try {
    fn(sandbox);
    console.log(`✓ ${name}`);
  } catch (err) {
    console.log(`✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Runs setup, returning its output and whether it succeeded.
function setup(...args) {
  try {
    return { ok: true, output: execFileSync('node', [SETUP, ...args], { encoding: 'utf8', stdio: 'pipe' }) };
  } catch (err) {
    return { ok: false, output: err.stderr };
  }
}

const read = (sandbox, file) => readFileSync(join(sandbox, file), 'utf8');
// Counts real script tags only: the template mentions sb-log in a commented-out example.
const scriptTags = (html, name) =>
  html.split('\n').filter((line) => line.trim() === `<script src="lib/sandkit/components/${name}/${name}.js"></script>`).length;

test('a new sandbox starts from the template, with the shell, catalog and practices', (sandbox) => {
  assert(setup(sandbox).ok, 'setup succeeded');
  for (const file of ['index.html', 'model.js', 'style.css', 'AGENTS.md', 'lib/sandkit/CATALOG.md',
    'lib/sandkit/shell/sb-shell.js', 'lib/sandkit/shell/manifest.md', 'lib/sandkit/practices/building-a-sandbox.md']) {
    assert(existsSync(join(sandbox, file)), `missing ${file}`);
  }
});

test('named components are copied, with a script tag each', (sandbox) => {
  setup(sandbox, 'sb-log', 'sb-id');
  assert(existsSync(join(sandbox, 'lib/sandkit/components/sb-log/manifest.md')), 'sb-log manifest copied');
  assert(existsSync(join(sandbox, 'lib/sandkit/components/sb-id/sb-id.js')), 'sb-id script copied');
  const html = read(sandbox, 'index.html');
  assert(scriptTags(html, 'sb-log') === 1 && scriptTags(html, 'sb-id') === 1, 'one tag each');
  assert(html.indexOf('sb-shell.js') < html.indexOf('sb-log.js'), 'components load after the shell');
});

test('running again adds components, keeps existing ones, and never duplicates tags', (sandbox) => {
  setup(sandbox, 'sb-log');
  setup(sandbox, 'sb-id');
  setup(sandbox);
  const html = read(sandbox, 'index.html');
  assert(scriptTags(html, 'sb-log') === 1 && scriptTags(html, 'sb-id') === 1, 'one tag each');
  assert(read(sandbox, 'lib/sandkit/SOURCE.md').includes('components/sb-log/sb-log.js'), 'sb-log still recorded');
});

test('the sandbox\'s own files are never overwritten', (sandbox) => {
  setup(sandbox);
  writeFileSync(join(sandbox, 'model.js'), '// my model\n');
  setup(sandbox, 'sb-log');
  assert(read(sandbox, 'model.js') === '// my model\n', 'model kept');
});

test('SOURCE.md records the repository, commit, date and every file copied', (sandbox) => {
  setup(sandbox, 'sb-log');
  const source = read(sandbox, 'lib/sandkit/SOURCE.md');
  assert(source.includes('github.com/sebjwallace/sandkit'), 'repository');
  assert(/at commit \w+, on \d{4}-\d{2}-\d{2}/.test(source), 'commit and date');
  assert(source.includes('- shell/sb-shell.js') && source.includes('- components/sb-log/manifest.md'), 'files listed');
});

test('an unknown component is refused before anything is copied', (sandbox) => {
  const result = setup(sandbox, 'sb-nothing');
  assert(!result.ok && result.output.includes('no component called sb-nothing'), 'explains');
  assert(!existsSync(join(sandbox, 'index.html')), 'nothing copied');
});

test('an in-progress component is refused, saying why', (sandbox) => {
  const result = setup(sandbox, 'sb-chart');
  assert(!result.ok && result.output.includes('still in progress'), 'explains');
});

test('without a folder, it explains how to use it', () => {
  const result = setup();
  assert(!result.ok && result.output.includes('Usage'), 'usage shown');
});
