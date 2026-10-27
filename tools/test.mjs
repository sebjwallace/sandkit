// Tests for the tools. Plain assertions, no libraries; run with `node tools/test.mjs`.

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { networkInterfaces, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SETUP = resolve(fileURLToPath(import.meta.url), '../setup.mjs');
const COMPONENTS = resolve(fileURLToPath(import.meta.url), '../../components');

// Tests run one after another, each waiting for the last, so a test can be async.
let queue = Promise.resolve();
function test(name, fn) {
  queue = queue.then(async () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'sandkit-sandbox-'));
    try {
      await fn(sandbox);
      console.log(`✓ ${name}`);
    } catch (err) {
      console.log(`✗ ${name} — ${err.message}`);
      process.exitCode = 1;
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const assertEqual = (actual, expected) =>
  assert(JSON.stringify(actual) === JSON.stringify(expected), `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

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

test('a new sandbox starts from the template, with the shell, catalog, style guide and practices', (sandbox) => {
  assert(setup(sandbox).ok, 'setup succeeded');
  for (const file of ['index.html', 'model.js', 'style.css', 'AGENTS.md', 'JOURNAL.md', 'lib/sandkit/CATALOG.md', 'lib/sandkit/STYLE.md',
    'lib/sandkit/shell/sb-shell.js', 'lib/sandkit/shell/manifest.md', 'lib/sandkit/practices/building-a-sandbox.md', 'lib/sandkit/practices/journal.md']) {
    assert(existsSync(join(sandbox, file)), `missing ${file}`);
  }
});

test('a new sandbox has comment mode: sb-comments copied, loaded once and in the shell\'s modes', (sandbox) => {
  setup(sandbox, 'sb-comments');
  assert(existsSync(join(sandbox, 'lib/sandkit/components/sb-comments/manifest.md')), 'sb-comments copied');
  const html = read(sandbox, 'index.html');
  assert(scriptTags(html, 'sb-comments') === 1, 'one tag, even when named');
  assert(html.includes('<sb-comments slot="modes">'), 'offered in the mode picker');
  assert(read(sandbox, 'lib/sandkit/SOURCE.md').includes('sb-comments'), 'its version recorded');
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

test('an engine is copied with its manifest and changelog, tagged once, recorded, and kept on update', (sandbox) => {
  setup(sandbox, 'sb-log', 'discovery');
  for (const file of ['discovery.js', 'manifest.md', 'CHANGELOG.md']) assert(existsSync(join(sandbox, `lib/sandkit/engines/discovery/${file}`)), `missing ${file}`);
  setup(sandbox);
  const html = read(sandbox, 'index.html');
  assertEqual(html.split('\n').filter((line) => line.trim() === '<script src="lib/sandkit/engines/discovery/discovery.js"></script>').length, 1);
  const source = read(sandbox, 'lib/sandkit/SOURCE.md');
  assert(/- discovery \d+\.\d+\.\d+/.test(source) && source.includes('- engines/discovery/discovery.js'), 'its version and files recorded');
});

test('a new sandbox gets sandbox.js, the page template, the sources folder, and the export, serve and sources tools', (sandbox) => {
  setup(sandbox);
  for (const file of ['sandbox.js', 'lib/sandkit/templates/page.html', 'lib/sandkit/tools/export.mjs', 'lib/sandkit/tools/serve.mjs', 'lib/sandkit/tools/sources.mjs', 'sources/catalogue.json', 'sources/inbox/.gitkeep', 'lib/sandkit/shell/sb-export.js']) {
    assert(existsSync(join(sandbox, file)), `missing ${file}`);
  }
  assert(read(sandbox, 'index.html').includes('<script src="sandbox.js"></script>'), 'index.html includes sandbox.js');
});

test('--page adds the named components\' tags to that page only', (sandbox) => {
  setup(sandbox, 'sb-id');
  writeFileSync(join(sandbox, 'stock.html'), read(sandbox, 'lib/sandkit/templates/page.html'));
  const { ok, output } = setup(sandbox, 'sb-log', '--page', 'stock.html');
  assert(ok && output.includes('Added script tags for sb-log to stock.html.'), output);
  assert(scriptTags(read(sandbox, 'stock.html'), 'sb-log') === 1 && scriptTags(read(sandbox, 'stock.html'), 'sb-id') === 0, 'only sb-log on stock.html');
  assert(scriptTags(read(sandbox, 'index.html'), 'sb-log') === 0, 'not on index.html');
});

test('--page refuses a page that doesn\'t exist, saying where to start one', (sandbox) => {
  setup(sandbox);
  const { ok, output } = setup(sandbox, 'sb-log', '--page', 'nope.html');
  assert(!ok && output.includes('has no page called nope.html') && output.includes('templates/page.html'), output);
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
  assert(!result.ok && result.output.includes('no component or engine called sb-nothing'), 'explains');
  assert(!existsSync(join(sandbox, 'index.html')), 'nothing copied');
});

test('a retired component is refused, naming what replaces it', (sandbox) => {
  const result = setup(sandbox, 'sb-source-trace');
  assert(!result.ok && result.output.includes('sb-source-trace is retired') && result.output.includes('sb-lineage'), 'explains');
  assert(!existsSync(join(sandbox, 'index.html')), 'nothing copied');
});

test('updating a sandbox that has a retired component leaves its copy as it is, and says what replaces it', (sandbox) => {
  setup(sandbox, 'sb-log');
  const retired = join(sandbox, 'lib/sandkit/components/sb-discovery-board');
  mkdirSync(retired);
  writeFileSync(join(retired, 'sb-discovery-board.js'), '// Sandkit sb-discovery-board 0.1.0 · MIT Licence\n// my copy\n');
  const { ok, output } = setup(sandbox);
  assert(ok, `setup succeeded: ${output}`);
  assert(read(sandbox, 'lib/sandkit/components/sb-discovery-board/sb-discovery-board.js').includes('// my copy'), 'its copy kept');
  assert(output.includes('sb-discovery-board is retired') && output.includes('sb-lineage'), 'says what replaces it');
  assert(existsSync(join(sandbox, 'lib/sandkit/components/sb-log/sb-log.js')), 'the rest still updated');
});

test('an in-progress component (one without a manifest yet) is refused, saying why', (sandbox) => {
  const inProgress = join(COMPONENTS, 'sb-test-in-progress');
  mkdirSync(inProgress);
  writeFileSync(join(inProgress, 'sb-test-in-progress.js'), '');
  try {
    const result = setup(sandbox, 'sb-test-in-progress');
    assert(!result.ok && result.output.includes('still in progress'), 'explains');
  } finally {
    rmSync(inProgress, { recursive: true, force: true });
  }
});

test('without a folder, it explains how to use it', () => {
  const result = setup();
  assert(!result.ok && result.output.includes('Usage'), 'usage shown');
});

// ---- Versions ----

// A temporary component in Sandkit, with the given changelog, for testing updates.
function withComponent(name, changelog, fn) {
  const folder = join(COMPONENTS, name);
  mkdirSync(folder);
  const version = changelog.match(/## (\d+\.\d+\.\d+)/)[1];
  writeFileSync(join(folder, `${name}.js`), `// Sandkit ${name} ${version} · MIT Licence\n`);
  writeFileSync(join(folder, 'manifest.md'), `# ${name}\n`);
  writeFileSync(join(folder, 'CHANGELOG.md'), changelog);
  try { fn(); } finally { rmSync(folder, { recursive: true, force: true }); }
}

// Pretends the sandbox has an older copy of a component installed.
function installOlder(sandbox, name, version) {
  const script = join(sandbox, `lib/sandkit/components/${name}/${name}.js`);
  writeFileSync(script, readFileSync(script, 'utf8').replace(/^(\/\/ Sandkit \S+) \S+/, `$1 ${version}`));
}

test('changelogs are copied with each component and the shell', (sandbox) => {
  setup(sandbox, 'sb-log');
  for (const file of ['CHANGELOG.md', 'shell/CHANGELOG.md', 'components/sb-log/CHANGELOG.md']) {
    assert(existsSync(join(sandbox, 'lib/sandkit', file)), `missing ${file}`);
  }
});

test('SOURCE.md records the version of Sandkit, the shell and every component', (sandbox) => {
  setup(sandbox, 'sb-log');
  const source = read(sandbox, 'lib/sandkit/SOURCE.md');
  assert(/- Sandkit \d+\.\d+\.\d+/.test(source), 'Sandkit version');
  assert(/- shell \d+\.\d+\.\d+/.test(source) && /- sb-log \d+\.\d+\.\d+/.test(source), 'shell and component versions');
});

test('updating reports what changed since the installed version, breaking changes first', (sandbox) => {
  withComponent('sb-test-versioned', [
    '## 0.3.0 · 2026-12-01', '- Added a colour option.', '- **Breaking:** `sb-old` renamed to `sb-new`; listen for `sb-new` instead.', '',
    '## 0.2.0 · 2026-11-01', '- Faster drawing.', '',
    '## 0.1.0 · 2026-10-01', '- First release.', ''
  ].join('\n'), () => {
    setup(sandbox, 'sb-test-versioned');
    installOlder(sandbox, 'sb-test-versioned', '0.1.0');
    const { output } = setup(sandbox);
    const lines = output.split('\n');
    const start = lines.indexOf('sb-test-versioned 0.1.0 → 0.3.0');
    assert(start >= 0, `version change reported:\n${output}`);
    assert(lines[start + 1].includes('**Breaking:**'), 'breaking change listed first');
    assert(output.includes('0.2.0: Faster drawing.') && output.includes('0.3.0: Added a colour option.'), 'every change since 0.1.0');
    assert(!output.includes('First release'), 'nothing from the installed version or earlier');
    assert(output.includes('apply them before using the sandbox'), 'migration reminder');
  });
});

test('nothing is reported when versions are unchanged', (sandbox) => {
  setup(sandbox, 'sb-log');
  assert(!setup(sandbox).output.includes('→'), 'no version changes');
});

// ---- analyse.mjs ----

const ANALYSE = resolve(fileURLToPath(import.meta.url), '../analyse.mjs');

function analyse(...args) {
  try {
    return { ok: true, output: execFileSync('node', [ANALYSE, ...args], { encoding: 'utf8', stdio: 'pipe' }) };
  } catch (err) {
    return { ok: false, output: err.stderr };
  }
}

const sample = (i) => ({ id: `S${i}`, kind: 'a', size: i });
const write = (folder, file, text) => writeFileSync(join(folder, file), text);

test('analyse profiles a file of samples as JSON, findings first', (folder) => {
  write(folder, 'data.json', JSON.stringify([1, 2, 3, 4, 5].map(sample)));
  const { ok, output } = analyse('profile', join(folder, 'data.json'));
  const result = JSON.parse(output);
  assert(ok && result.count === 5, 'five samples');
  assert(Object.keys(result).indexOf('findings') < Object.keys(result).indexOf('fields'), 'findings before fields');
  assert(result.findings.some((f) => f.kind === 'constant' && f.path === 'kind'), 'kind is constant');
});

test('analyse joins a folder\'s files in name order, single samples and arrays alike', (folder) => {
  write(folder, 'b.json', JSON.stringify([sample(2), sample(3)]));
  write(folder, 'a.json', JSON.stringify(sample(1)));
  write(folder, 'notes.txt', 'not data');
  const result = JSON.parse(analyse('profile', folder).output);
  assert(result.count === 3, `three samples, got ${result.count}`);
  assert(JSON.stringify(result.fields[0].values.map((v) => v.value)) === '["S1","S2","S3"]', 'in name order');
});

test('analyse reads JSON Lines, skipping blank lines', (folder) => {
  write(folder, 'data.jsonl', `${JSON.stringify(sample(1))}\n\n${JSON.stringify(sample(2))}\n`);
  assert(JSON.parse(analyse('profile', join(folder, 'data.jsonl')).output).count === 2, 'two samples');
});

test('analyse passes options to the analysis, numbers as numbers', (folder) => {
  write(folder, 'data.json', JSON.stringify([1, 2, 3].map(sample)));
  const result = JSON.parse(analyse('profile', join(folder, 'data.json'), '--limit', '1').output);
  const size = result.fields.find((f) => f.path === 'size');
  assert(size.values.length === 1 && size.more === 2, 'limited to one value');
});

test('analyse --md writes a summary, findings first', (folder) => {
  write(folder, 'data.json', JSON.stringify([1, 2, 3, 4, 5].map(sample)));
  const { output } = analyse('profile', join(folder, 'data.json'), '--md');
  assert(output.includes('`kind`: always a'), `finding in words:\n${output}`);
  assert(output.indexOf('## Findings') < output.indexOf('## Fields'), 'findings first');
});

test('analyse list names each analysis and its component', () => {
  const { ok, output } = analyse('list');
  assert(ok && /^profile +sb-profile +The shape/m.test(output), `listed:\n${output}`);
});

test('analyse list names sb-dependencies\' analysis too', () => {
  assert(/^dependencies +sb-dependencies +What goes with what/m.test(analyse('list').output), 'listed');
});

// Forty samples where kind decides half, and group but for one.
const related = (i) => ({ id: `S${i}`, kind: ['a', 'b', 'c', 'd'][i % 4], half: i % 4 < 2 ? 'first' : 'second', group: i === 7 ? 'odd' : i % 2 ? 'x' : 'y' });

test('analyse finds dependencies, the same as the core', (folder) => {
  const samples = Array.from({ length: 40 }, (_, i) => related(i));
  write(folder, 'data.json', JSON.stringify(samples));
  const module = { exports: {} };
  new Function('module', readFileSync(join(COMPONENTS, 'sb-dependencies/sb-dependencies.js'), 'utf8'))(module);
  const output = analyse('dependencies', join(folder, 'data.json'), '--id', 'id').output;
  assert(output === `${JSON.stringify(module.exports.dependencies(samples, { id: 'id' }))}\n`, `same result:\n${output}`);
});

test('analyse takes an analysis\'s flags without a value', (folder) => {
  write(folder, 'data.json', JSON.stringify(Array.from({ length: 40 }, (_, i) => related(i))));
  const { ok, output } = analyse('dependencies', '--pairs', join(folder, 'data.json'));
  assert(ok && JSON.parse(output).count === 40, `the file after --pairs is read as input:\n${output}`);
});

test('analyse dependencies --md leads with near-misses', (folder) => {
  write(folder, 'data.json', JSON.stringify(Array.from({ length: 40 }, (_, i) => related(i))));
  const { output } = analyse('dependencies', join(folder, 'data.json'), '--md', '--id', 'id');
  assert(output.includes('## Near-misses') && output.includes('but odd in 1 sample (S7)'), `near-miss:\n${output}`);
  assert(output.indexOf('## Near-misses') < output.indexOf('## Rules'), 'near-misses first');
});

test('analyse explains an unknown analysis, bad JSON and missing inputs', (folder) => {
  const unknown = analyse('nope', folder);
  assert(!unknown.ok && unknown.output.includes('Available: dependencies, profile'), 'unknown analysis');
  write(folder, 'bad.jsonl', '{"a":1}\n{oops}\n');
  const bad = analyse('profile', join(folder, 'bad.jsonl'));
  assert(!bad.ok && bad.output.includes('bad.jsonl, line 2 isn\'t valid JSON'), `bad JSON: ${bad.output}`);
  assert(!analyse('profile').ok, 'no inputs');
});

// ---- export.mjs ----

const EXPORT = resolve(fileURLToPath(import.meta.url), '../export.mjs');
const TWO_PAGES = resolve(fileURLToPath(import.meta.url), '../fixtures/two-pages');
const SANDKIT_VERSION = readFileSync(resolve(fileURLToPath(import.meta.url), '../../CHANGELOG.md'), 'utf8').match(/^## (\S+)/m)[1];

function exportTool(...args) {
  try {
    return { ok: true, output: execFileSync('node', [EXPORT, ...args], { encoding: 'utf8', stdio: 'pipe' }) };
  } catch (err) {
    return { ok: false, output: err.stdout + err.stderr };
  }
}

// A page that points to every kind of thing an export meets.
function edgeSandbox(folder) {
  write(folder, 'page.html', [
    '<link rel="stylesheet" href="style.css">',
    '<script src="first.js"></script>',
    '<script src="https://cdn.example.com/lib.js"></script>',
    '<script src="second.js"></script>',
    '<sb-shell></sb-shell>',
    '<img srcset="a.png 1x, b.png 2x">',
    '<div style="background: url(\'a.png\')"></div>'
  ].join('\n'));
  write(folder, 'style.css', 'body { background: url(b.png); } h1 { background: url("https://example.com/x.png"); }');
  write(folder, 'first.js', 'const tag = "</script>"; fetch("data.json"); const picture = "pics/lemon.png";');
  write(folder, 'second.js', 'window.second = true;');
  write(folder, 'a.png', 'A');
  write(folder, 'b.png', 'B');
}

test('export puts in only what the page points to, scripts in order, and marks the shell', (folder) => {
  const out = join(folder, 'second.html');
  const { ok, output } = exportTool(join(TWO_PAGES, 'second.html'), '--out', out);
  const html = readFileSync(out, 'utf8');
  assert(ok, output);
  assert(!/<script[^>]*\bsrc=/.test(html) && !html.includes('<link'), 'nothing left to fetch');
  const order = ['Sandkit sb-theme-settings', 'Sandkit sb-shell', 'Sandkit sb-bars', 'lemonadeCosts', 'function createModel'].map((s) => html.indexOf(s));
  assert(order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1])), `in page order: ${order}`);
  assert(!output.includes('index.html') && !output.includes('sb-parameters'), 'nothing from the other page');
  assert(html.includes('src="data:image/svg+xml;base64,'), 'the image is inside');
  assert(html.includes(`<sb-shell exported="${new Date().toISOString().slice(0, 10)}" version="0.2.0" sandkit="${SANDKIT_VERSION}" page="second.html">`), 'shell marked');
  assert(output.includes('10 files') && !output.includes('Warnings'), `report:\n${output}`);
});

test('export leaves images out when asked, and says so', (folder) => {
  const out = join(folder, 'second.html');
  const { output } = exportTool(join(TWO_PAGES, 'second.html'), '--no-images', '--out', out);
  const html = readFileSync(out, 'utf8');
  assert(!html.includes('data:image') && html.includes('<img class="lemon" alt="A lemon">'), 'image gone, its description kept');
  assert(output.includes('Left out, as asked:') && output.includes('lemon.svg'), output);
});

test('export inlines stylesheets, their urls, srcsets and style urls, and escapes </script', (folder) => {
  edgeSandbox(folder);
  exportTool(join(folder, 'page.html'));
  const html = readFileSync(join(folder, 'export', 'page.html'), 'utf8');
  const [a, b] = ['A', 'B'].map((letter) => `data:image/png;base64,${Buffer.from(letter).toString('base64')}`);
  assert(html.includes(`<style>\nbody { background: url("${b}"); }`), 'css url inlined');
  assert(html.includes(`srcset="${a} 1x, ${b} 2x"`), 'srcset inlined');
  assert(html.includes(`<div style="background: url('${a}')"></div>`), 'style url inlined, keeping the attribute whole');
  assert(html.includes('const tag = "<\\/script>"'), '</script escaped');
  assert(html.indexOf('window.second') > html.indexOf('const tag'), 'scripts kept in order');
});

test('export keeps remote urls and warns about them, fetching and files named in code', (folder) => {
  edgeSandbox(folder);
  const { ok, output } = exportTool(join(folder, 'page.html'));
  const html = readFileSync(join(folder, 'export', 'page.html'), 'utf8');
  assert(ok, output);
  assert(html.includes('<script src="https://cdn.example.com/lib.js"></script>') && html.includes('url("https://example.com/x.png")'), 'remote kept');
  for (const warning of ['needs the internet: https://cdn.example.com/lib.js', 'needs the internet: https://example.com/x.png',
    'first.js fetches files', 'first.js names a file in its code, which isn\'t included: "pics/lemon.png"']) {
    assert(output.includes(warning), `warns: ${warning}\n${output}`);
  }
});

test('export fails on a missing script, naming it, and on a missing page', (folder) => {
  write(folder, 'page.html', '<script src="lib/gone.js"></script>');
  const missing = exportTool(join(folder, 'page.html'));
  assert(!missing.ok && missing.output.includes('A script the page includes is missing: lib/gone.js'), missing.output);
  assert(!existsSync(join(folder, 'export')), 'nothing written');
  const noPage = exportTool(join(folder, 'nope.html'));
  assert(!noPage.ok && noPage.output.includes('There\'s no page at'), noPage.output);
});

test('export --all exports every page to its own file', (folder) => {
  write(folder, 'index.html', '<p>one</p>');
  write(folder, 'two.html', '<p>two</p>');
  assert(exportTool(folder, '--all').ok, 'exported');
  assert(['index.html', 'two.html'].every((page) => existsSync(join(folder, 'export', page))), 'both written');
});

// ---- serve ----

const SERVE = resolve(fileURLToPath(import.meta.url), '../serve.mjs');
let nextPort = 18300 + Math.floor(Math.random() * 500);

// Starts the server on a folder, resolving once it says where it's listening.
function startServer(folder, port = nextPort += 10) {
  const child = spawn('node', [SERVE, folder, '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((done, failed) => {
    child.stdout.on('data', (data) => {
      const url = String(data).match(/http:\/\/\S+/)?.[0];
      if (url) done({ url, stop: () => child.kill() });
    });
    child.stderr.on('data', (data) => failed(new Error(String(data))));
  });
}

async function served(folder, fn) {
  const server = await startServer(folder);
  try {
    await fn(server.url);
  } finally {
    server.stop();
  }
}

// A request sent exactly as written, since fetch would tidy away the dots in a path.
function rawGet(url, path) {
  return new Promise((done, failed) => {
    const { hostname, port } = new URL(url);
    request({ hostname, port, path }, (res) => { res.resume(); done(res.statusCode); }).on('error', failed).end();
  });
}

const postInbox = (url, body) => fetch(`${url}/_sandkit/inbox`, { method: 'POST', body: JSON.stringify(body) });

test('serve serves the folder\'s files with their types, and index.html for a folder', (folder) => served(folder, async (url) => {
  write(folder, 'index.html', '<p>home</p>');
  write(folder, 'model.js', 'const x = 1;');
  const page = await fetch(`${url}/`);
  assert(page.headers.get('content-type').startsWith('text/html') && (await page.text()) === '<p>home</p>', 'index.html');
  const script = await fetch(`${url}/model.js`);
  assert(script.headers.get('content-type').startsWith('text/javascript'), script.headers.get('content-type'));
  assert((await fetch(`${url}/missing.js`)).status === 404, 'missing is 404');
}));

test('serve refuses paths outside the folder', (folder) => served(folder, async (url) => {
  for (const path of ['/../secret.txt', '/..%2fsecret.txt', '/%2e%2e/secret.txt']) {
    const status = await rawGet(url, path);
    assert(status === 403 || status === 404, `${path} gave ${status}`);
  }
  assert((await fetch(`${url}/_sandkit/files?dir=..`)).status === 403, 'listing outside refused');
}));

test('serve lists the files under a folder, with size and time', (folder) => served(folder, async (url) => {
  mkdirSync(join(folder, 'sources/notes'), { recursive: true });
  write(folder, 'sources/catalogue.json', '{}');
  write(folder, 'sources/notes/a.txt', 'hello');
  const files = await (await fetch(`${url}/_sandkit/files?dir=sources`)).json();
  assertEqual(files.map((f) => f.path).sort(), ['sources/catalogue.json', 'sources/notes/a.txt']);
  const note = files.find((f) => f.path.endsWith('a.txt'));
  assert(note.size === 5 && !isNaN(Date.parse(note.modified)), JSON.stringify(note));
  assertEqual(await (await fetch(`${url}/_sandkit/files?dir=nothing-here`)).json(), []);
}));

test('serve writes to the inbox with a safe name, never overwriting', (folder) => served(folder, async (url) => {
  const first = await (await postInbox(url, { name: '../My notes!.json', content: 'one' })).json();
  const second = await (await postInbox(url, { name: 'My notes!.json', content: 'two' })).json();
  assertEqual([first.path, second.path], ['sources/inbox/My-notes-.json', 'sources/inbox/My-notes--2.json']);
  assert(read(folder, first.path) === 'one' && read(folder, second.path) === 'two', 'contents kept');
  assert((await postInbox(url, { name: 'x.txt' })).status === 400, 'content required');
}));

test('serve refuses a body over 5 MB, writing nothing', (folder) => served(folder, async (url) => {
  const res = await postInbox(url, { name: 'big.txt', content: 'x'.repeat(5 * 1024 * 1024 + 1) }).catch(() => null);
  assert(!res || res.status === 413, `status ${res?.status}`);
  assert(!existsSync(join(folder, 'sources/inbox/big.txt')), 'nothing written');
}));

test('serve tries the next port when one is taken, and says which', async (folder) => {
  const port = nextPort += 10;
  const blocker = createServer().listen(port, '127.0.0.1');
  await new Promise((done) => blocker.once('listening', done));
  try {
    const server = await startServer(folder, port);
    server.stop();
    assert(server.url === `http://127.0.0.1:${port + 1}`, server.url);
  } finally {
    blocker.close();
  }
});

test('serve listens on this computer only', (folder) => served(folder, async (url) => {
  assert(url.startsWith('http://127.0.0.1:'), url);
  const address = Object.values(networkInterfaces()).flat().find((a) => a.family === 'IPv4' && !a.internal)?.address;
  if (!address) return; // no network to try from
  const reached = await fetch(url.replace('127.0.0.1', address)).then(() => true, () => false);
  assert(!reached, `reachable at ${address}`);
}));

// ---- sources.mjs ----

const SOURCES = resolve(fileURLToPath(import.meta.url), '../sources.mjs');

function checkSources(folder) {
  try {
    return { ok: true, output: execFileSync('node', [SOURCES, 'check', folder], { encoding: 'utf8', stdio: 'pipe' }) };
  } catch (err) {
    return { ok: false, output: err.stdout + err.stderr };
  }
}

// A small sandbox whose sources all check out: a transcript, a PDF and a session of comments.
function sourcedSandbox(folder, items) {
  mkdirSync(join(folder, 'sources/interviews'), { recursive: true });
  mkdirSync(join(folder, 'sources/inbox'), { recursive: true });
  write(folder, 'sources/interviews/floor.txt', 'We reorder as soon as we\n   drop under forty.');
  write(folder, 'sources/policy.pdf', '%PDF-1.4');
  write(folder, 'sources/session.json', JSON.stringify({ format: 'sandkit-annotations', annotations: [{ n: 1, text: 'Yes.' }] }));
  write(folder, 'sources/inbox/.gitkeep', '');
  write(folder, 'sources/catalogue.json', JSON.stringify({ format: 'sandkit-sources', version: 1, sources: [
    { id: 'SRC-1', title: 'Floor interview', path: 'sources/interviews/floor.txt' },
    { id: 'SRC-2', title: 'Policy', path: 'sources/policy.pdf', respondsTo: 'SRC-1' },
    { id: 'SRC-3', title: 'Review', path: 'sources/session.json', derivedFrom: ['SRC-1'], supersedes: 'SRC-2' }
  ] }));
  write(folder, 'model.js', `const ITEMS = ${JSON.stringify(items ?? [
    { id: 'RUL-1', sources: [{ source: 'SRC-1', quote: 'we reorder as soon as we drop under forty' }], restsOn: ['PAR-1'] },
    { id: 'PAR-1', sources: [{ source: 'SRC-2', page: 3, quote: 'forty' }, { source: 'SRC-3', annotation: 1 }] }
  ])};\nif (typeof module !== 'undefined') module.exports = { ITEMS };`);
}

test('sources check passes sources that agree with the catalogue and the model', (folder) => {
  sourcedSandbox(folder);
  const { ok, output } = checkSources(folder);
  assert(ok && output.includes('The sources check out.'), output);
});

test('sources check notes what it can\'t check, citing nothing, and the inbox, without failing', (folder) => {
  sourcedSandbox(folder);
  write(folder, 'sources/inbox/new.txt', 'later');
  write(folder, 'model.js', `const ITEMS = [{ id: 'PAR-1', sources: [{ source: 'SRC-2', page: 3, quote: 'forty' }] }, { id: 'ASM-1' }];
module.exports = { ITEMS };`);
  const { ok, output } = checkSources(folder);
  assert(ok, output);
  for (const note of ['PAR-1\'s quote in SRC-2 is not checked (pdf).', 'ASM-1 cites no source.', '1 file waits in the inbox']) {
    assert(output.includes(note), `notes: ${note}\n${output}`);
  }
});

test('sources check fails a broken catalogue: missing files, repeated ids, uncatalogued files and bad links', (folder) => {
  sourcedSandbox(folder);
  const catalogue = JSON.parse(read(folder, 'sources/catalogue.json'));
  catalogue.sources.push({ id: 'SRC-1', title: 'Again', path: 'sources/gone.txt', derivedFrom: ['SRC-9'] });
  write(folder, 'sources/catalogue.json', JSON.stringify(catalogue));
  write(folder, 'sources/stray.md', 'not catalogued');
  const { ok, output } = checkSources(folder);
  assert(!ok, 'fails');
  for (const error of ['SRC-1 is used by more than one source.', 'SRC-1\'s file is missing: sources/gone.txt',
    'SRC-1\'s derivedFrom names SRC-9', 'sources/stray.md isn\'t in the catalogue.']) {
    assert(output.includes(error), `reports: ${error}\n${output}`);
  }
});

test('sources check fails citations of unknown sources, quotes not found, missing annotations and unknown items', (folder) => {
  sourcedSandbox(folder, [
    { id: 'RUL-1', sources: [{ source: 'SRC-1', quote: 'we reorder at thirty' }, { source: 'SRC-7', quote: 'x' }], restsOn: ['PAR-9'] },
    { id: 'RUL-2', sources: [{ source: 'SRC-3', annotation: 4 }] }
  ]);
  const { ok, output } = checkSources(folder);
  assert(!ok, 'fails');
  for (const error of ['RUL-1 quotes SRC-1, but the quote isn\'t in it: "we reorder at thirty"', 'RUL-1 cites SRC-7, which isn\'t in the catalogue.',
    'RUL-1 rests on PAR-9, which isn\'t in ITEMS.', 'RUL-2 cites annotation 4 of SRC-3, which has none by that number.']) {
    assert(output.includes(error), `reports: ${error}\n${output}`);
  }
});

test('sources check explains a missing catalogue, and a model without items', (folder) => {
  write(folder, 'model.js', 'module.exports = {};');
  const { ok, output } = checkSources(folder);
  assert(!ok && output.includes('There\'s no sources/catalogue.json.'), output);
  assert(output.includes('model.js exports no ITEMS'), output);
});
