// Tests for the tools. Plain assertions, no libraries; run with `node tools/test.mjs`.

import { execFileSync, spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { createRequire } from 'node:module';
import { networkInterfaces, tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SETUP = resolve(fileURLToPath(import.meta.url), '../setup.mjs');
const COMPONENTS = resolve(fileURLToPath(import.meta.url), '../../components');
const MECHANISMS = resolve(fileURLToPath(import.meta.url), '../../mechanisms');
const FIXTURE_MECHANISM = resolve(fileURLToPath(import.meta.url), '../fixtures/mechanism');

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
  for (const file of ['index.html', 'model.js', 'style.css', 'AGENTS.md', 'CLAUDE.md', 'JOURNAL.md', 'lib/sandkit/CATALOG.md', 'lib/sandkit/STYLE.md',
    'lib/sandkit/shell/sb-shell.js', 'lib/sandkit/shell/manifest.md', 'lib/sandkit/practices/building-a-sandbox.md', 'lib/sandkit/practices/journal.md']) {
    assert(existsSync(join(sandbox, file)), `missing ${file}`);
  }
});

test('an existing sandbox without CLAUDE.md gets one; one already there is left alone', (sandbox) => {
  setup(sandbox);
  rmSync(join(sandbox, 'CLAUDE.md'));
  setup(sandbox);
  assertEqual(read(sandbox, 'CLAUDE.md'), '@AGENTS.md\n');
  writeFileSync(join(sandbox, 'CLAUDE.md'), 'our own\n');
  setup(sandbox);
  assertEqual(read(sandbox, 'CLAUDE.md'), 'our own\n');
});

const INDEX_START = '<!-- sandkit:find-by-need -->';
const INDEX_END = '<!-- /sandkit:find-by-need -->';
const findByNeed = () => readFileSync(resolve(COMPONENTS, '../CATALOG.md'), 'utf8').match(/^## Find by need\n+([\s\S]*?)\n+^## /m)[1];
const indexBlock = () => `${INDEX_START}\n${findByNeed()}\n${INDEX_END}`;
const count = (text, part) => text.split(part).length - 1;

test('a new sandbox\'s AGENTS.md has the catalog\'s Find by need index, once, under Sandkit components', (sandbox) => {
  setup(sandbox);
  const agents = read(sandbox, 'AGENTS.md');
  assert(count(agents, INDEX_START) === 1 && count(agents, INDEX_END) === 1, 'one block');
  assert(agents.includes(indexBlock()), 'the catalog\'s index between the markers');
  const at = agents.indexOf(INDEX_START);
  assert(agents.lastIndexOf('\n## Sandkit components', at) > agents.lastIndexOf('\n## This sandbox', at), 'inside Sandkit components');
});

// Sandkit's sections as a fresh sandbox has them, markers included.
function currentSection(name) {
  const fresh = mkdtempSync(join(tmpdir(), 'sandkit-fresh-'));
  try {
    setup(fresh);
    const agents = read(fresh, 'AGENTS.md');
    const end = `<!-- /sandkit:${name} -->`;
    return agents.slice(agents.indexOf(`<!-- sandkit:${name} -->`), agents.indexOf(end) + end.length);
  } finally {
    rmSync(fresh, { recursive: true, force: true });
  }
}

const COMPONENTS_SECTION = currentSection('components');
const MECHANISMS_SECTION = currentSection('mechanisms');
const REPLACED = 'lib/sandkit/AGENTS-replaced.md';

test('a new sandbox\'s AGENTS.md has Sandkit\'s sections between markers, the index inside the first', (sandbox) => {
  setup(sandbox);
  const agents = read(sandbox, 'AGENTS.md');
  assert(agents.includes(`${COMPONENTS_SECTION}\n\n${MECHANISMS_SECTION}\n\n## This sandbox's components`), 'in the template\'s place');
  assert(COMPONENTS_SECTION.startsWith('<!-- sandkit:components -->\n## Sandkit components') && COMPONENTS_SECTION.includes(indexBlock()), 'components, with the index');
  assert(MECHANISMS_SECTION.startsWith('<!-- sandkit:mechanisms -->\n## Sandkit mechanisms'), 'mechanisms');
});

test('a current sandbox is left unchanged, and nothing is saved', (sandbox) => {
  setup(sandbox);
  const before = read(sandbox, 'AGENTS.md');
  const { output } = setup(sandbox);
  assertEqual(read(sandbox, 'AGENTS.md'), before);
  assert(!output.includes('Refreshed') && !existsSync(join(sandbox, REPLACED)), output);
});

test('what\'s between the markers is refreshed, and the sandbox\'s text just outside them stays byte for byte', (sandbox) => {
  setup(sandbox);
  const fresh = read(sandbox, 'AGENTS.md');
  const stale = (name) => `<!-- sandkit:${name} -->\nstale\n<!-- /sandkit:${name} -->`;
  const withSections = (first, second) => `Ours, before.  \n\n\n${first}Ours, between.\t${second}\nOurs, after.\n\n\n`;
  writeFileSync(join(sandbox, 'AGENTS.md'), withSections(stale('components'), stale('mechanisms')));
  const { output } = setup(sandbox);
  assertEqual(read(sandbox, 'AGENTS.md'), withSections(COMPONENTS_SECTION, MECHANISMS_SECTION));
  assert(output.includes('Refreshed Sandkit\'s sections in AGENTS.md.') && !existsSync(join(sandbox, REPLACED)), output);
  assert(fresh.includes(COMPONENTS_SECTION), 'the same sections as a new sandbox');
});

test('an older sandbox has its sections replaced by heading, the old text saved, and the rest untouched', (sandbox) => {
  setup(sandbox);
  const oldIndex = `${INDEX_START}\nold index\n${INDEX_END}`;
  writeFileSync(join(sandbox, 'AGENTS.md'), `# Ours\n\n## Sandkit components\n\n- Use them.\n- Our own line.\n\n${oldIndex}\n\n## Sandkit mechanisms\n\n- Old advice.\n\n## Conventions\n\n- Ours.\n`);
  const { output } = setup(sandbox);
  assertEqual(read(sandbox, 'AGENTS.md'), `# Ours\n\n${COMPONENTS_SECTION}\n\n${MECHANISMS_SECTION}\n\n## Conventions\n\n- Ours.\n`);
  const saved = read(sandbox, REPLACED);
  assert(saved.includes('## Sandkit components\n\n- Use them.\n- Our own line.') && saved.includes('## Sandkit mechanisms\n\n- Old advice.'), saved);
  assert(!saved.includes('old index'), 'not the index, which was never the sandbox\'s');
  assert(output.includes('Saved the text those sections replaced to lib/sandkit/AGENTS-replaced.md'), output);
  const after = setup(sandbox);
  assert(!after.output.includes('Saved the text') && read(sandbox, REPLACED) === saved, 'once only');
});

test('an older sandbox without a mechanisms section gets one in the template\'s position', (sandbox) => {
  setup(sandbox);
  writeFileSync(join(sandbox, 'AGENTS.md'), '# Ours\n\n## Sandkit components\n\n- Use them.\n\n## This sandbox\'s components\n\nOurs.\n\n## Conventions\n\n- Ours.\n');
  setup(sandbox);
  assertEqual(read(sandbox, 'AGENTS.md'), `# Ours\n\n${COMPONENTS_SECTION}\n\n${MECHANISMS_SECTION}\n\n## This sandbox's components\n\nOurs.\n\n## Conventions\n\n- Ours.\n`);
  assert(!read(sandbox, REPLACED).includes('Sandkit mechanisms'), 'nothing to save for a section that wasn\'t there');
});

test('a section with markers keeps them when another is added before it', (sandbox) => {
  setup(sandbox);
  writeFileSync(join(sandbox, 'AGENTS.md'), `# Ours\n\n${MECHANISMS_SECTION}\n\n## Conventions\n`);
  setup(sandbox);
  assertEqual(read(sandbox, 'AGENTS.md'), `# Ours\n\n${COMPONENTS_SECTION}\n\n${MECHANISMS_SECTION}\n\n## Conventions\n`);
  assert(!existsSync(join(sandbox, REPLACED)), 'nothing replaced');
});

test('without Sandkit\'s sections, they go at the end of the file, and an index left there goes', (sandbox) => {
  setup(sandbox);
  writeFileSync(join(sandbox, 'AGENTS.md'), `# Ours\n\nNotes.\n\n${INDEX_START}\nold index\n${INDEX_END}\n`);
  setup(sandbox);
  assertEqual(read(sandbox, 'AGENTS.md'), `# Ours\n\nNotes.\n\n${COMPONENTS_SECTION}\n\n${MECHANISMS_SECTION}\n`);
});

test('saving again adds to what was saved, never overwriting it', (sandbox) => {
  setup(sandbox);
  writeFileSync(join(sandbox, 'AGENTS.md'), '## Sandkit components\n\n- First.\n');
  setup(sandbox);
  writeFileSync(join(sandbox, 'AGENTS.md'), '## Sandkit components\n\n- Second.\n');
  setup(sandbox);
  writeFileSync(join(sandbox, 'AGENTS.md'), '## Sandkit components\n\n- Third.\n');
  const [latest, , older] = rootReleases();
  installOlderSandkit(sandbox, older);
  setup(sandbox);
  const saved = read(sandbox, REPLACED);
  assert(saved.includes('- First.') && saved.includes('- Second.') && saved.includes('- Third.'), saved);
  const today = new Date().toISOString().slice(0, 10);
  assert(saved.includes(`## ${today}, Sandkit ${latest}\n\n## Sandkit components\n\n- Second.`), `headed by the version:\n${saved}`);
  assert(saved.includes(`## ${today}, Sandkit ${older} → ${latest}\n\n## Sandkit components\n\n- Third.`), `headed by the update:\n${saved}`);
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

// A fixture stands in for a mechanism in mechanisms/ while a test runs, so these tests don't depend on a real one's version.
async function withFixtureMechanism(name, fn) {
  const folder = join(MECHANISMS, name);
  assert(!existsSync(folder), `mechanisms/${name} already exists`);
  cpSync(join(FIXTURE_MECHANISM, 'lib/sandkit/mechanisms/sb-tally'), folder, { recursive: true });
  if (name !== 'sb-tally') renameSync(join(folder, 'sb-tally.js'), join(folder, `${name}.js`));
  try { await fn(); } finally { rmSync(folder, { recursive: true, force: true }); }
}

test('a mechanism is copied with its manifest and changelog, tagged once before model.js, recorded, and kept on update', (sandbox) => withFixtureMechanism('sb-tally', () => {
  setup(sandbox, 'sb-log', 'sb-tally');
  for (const file of ['sb-tally.js', 'manifest.md', 'CHANGELOG.md']) assert(existsSync(join(sandbox, `lib/sandkit/mechanisms/sb-tally/${file}`)), `missing ${file}`);
  setup(sandbox);
  const lines = read(sandbox, 'index.html').split('\n').map((line) => line.trim());
  const tag = '<script src="lib/sandkit/mechanisms/sb-tally/sb-tally.js"></script>';
  assertEqual(lines.filter((line) => line === tag).length, 1);
  assertEqual(lines[lines.indexOf(tag) + 1], '<script src="model.js"></script>');
  const source = read(sandbox, 'lib/sandkit/SOURCE.md');
  assert(source.includes('- sb-tally 0.1.0') && source.includes('- mechanisms/sb-tally/sb-tally.js'), 'its version and files recorded');
}));

// Five pages: three load the model, one doesn't, and one that does already has the mechanism's tag.
const MECHANISM_TAG = '<script src="lib/sandkit/mechanisms/sb-store/sb-store.js"></script>';
const MODEL_TAG = '<script src="model.js"></script>';
const pageWith = (...tags) => `<!doctype html>\n<body>\n  ${tags.join('\n  ')}\n</body>\n`;

function multiPageSandbox(sandbox) {
  setup(sandbox);
  writeFileSync(join(sandbox, 'food.html'), pageWith(MODEL_TAG));
  writeFileSync(join(sandbox, 'sources.html'), pageWith(MODEL_TAG, '<script src="sources.js"></script>'));
  writeFileSync(join(sandbox, 'about.html'), pageWith('<script src="about.js"></script>'));
  writeFileSync(join(sandbox, 'tagged.html'), pageWith(MECHANISM_TAG, MODEL_TAG));
}

const isTaggedBeforeModel = (html) => html.includes(`${MECHANISM_TAG}\n  ${MODEL_TAG}`) && count(html, MECHANISM_TAG) === 1;

test('a mechanism is tagged before model.js on every page that loads the model, and only those', (sandbox) => {
  multiPageSandbox(sandbox);
  const about = read(sandbox, 'about.html'), tagged = read(sandbox, 'tagged.html');
  const { output } = setup(sandbox, 'sb-store');
  for (const page of ['index.html', 'food.html', 'sources.html', 'tagged.html']) assert(isTaggedBeforeModel(read(sandbox, page)), `${page} tagged once, before model.js`);
  assertEqual(read(sandbox, 'about.html'), about);
  assertEqual(read(sandbox, 'tagged.html'), tagged);
  assert(output.includes('Added script tags for sb-store to food.html, index.html, sources.html.'), `says which pages:\n${output}`);
});

test('--page doesn\'t apply to a mechanism, but still does to a component named with it', (sandbox) => {
  multiPageSandbox(sandbox);
  writeFileSync(join(sandbox, 'about.html'), pageWith('<script src="lib/sandkit/shell/sb-shell.js"></script>'));
  setup(sandbox, 'sb-store', 'sb-log', '--page', 'about.html');
  assert(!read(sandbox, 'about.html').includes('sb-store'), 'not on the page named, which has no model');
  assert(isTaggedBeforeModel(read(sandbox, 'food.html')), 'on a page with the model');
  assert(scriptTags(read(sandbox, 'about.html'), 'sb-log') === 1 && scriptTags(read(sandbox, 'index.html'), 'sb-log') === 0, 'the component only on the page named');
});

test('an installed mechanism reaches a page added later, without being named', (sandbox) => {
  setup(sandbox, 'sb-store');
  writeFileSync(join(sandbox, 'food.html'), pageWith(MODEL_TAG));
  const { output } = setup(sandbox);
  assert(isTaggedBeforeModel(read(sandbox, 'food.html')), 'tagged');
  assert(output.includes('Added script tags for sb-store to food.html.'), output);
  assert(!setup(sandbox).output.includes('Added script tags'), 'quiet when every page has it');
});

test('when no page loads the model, it says to add a mechanism\'s tags by hand', (sandbox) => {
  setup(sandbox);
  writeFileSync(join(sandbox, 'index.html'), read(sandbox, 'index.html').replace(MODEL_TAG, ''));
  const { ok, output } = setup(sandbox, 'sb-store');
  assert(ok && output.includes('Add script tags for sb-store yourself') && !read(sandbox, 'index.html').includes('sb-store'), output);
});

test('a sandbox\'s model loads a mechanism set up in it, under Node', (sandbox) => withFixtureMechanism('sb-tally', () => {
  setup(sandbox, 'sb-tally');
  cpSync(join(FIXTURE_MECHANISM, 'model.js'), join(sandbox, 'model.js'));
  const turnedAway = execFileSync('node', ['-e', 'console.log(require("./model.js").createModel().stock(5))'], { cwd: sandbox, encoding: 'utf8' });
  assertEqual(turnedAway.trim(), '2');
}));

test('a name that\'s both a component and a mechanism is refused, before anything is copied', (sandbox) => withFixtureMechanism('sb-log', () => {
  const result = setup(sandbox, 'sb-log');
  assert(!result.ok && result.output.includes('more than one of Sandkit\'s components and mechanisms'), 'explains');
  assert(!existsSync(join(sandbox, 'index.html')), 'nothing copied');
}));

test('new pages have page-wide highlighting, and the sandbox\'s AGENTS.md says so', (sandbox) => {
  setup(sandbox);
  const tag = '<script src="lib/sandkit/shell/sb-highlighting.js"></script>';
  assert(readFileSync(join(sandbox, 'index.html'), 'utf8').includes(tag), 'the first page');
  assert(readFileSync(join(sandbox, 'lib/sandkit/templates/page.html'), 'utf8').includes(tag), 'the page template');
  assert(readFileSync(join(sandbox, 'AGENTS.md'), 'utf8').includes('**Pointing is free.**'), 'AGENTS.md');
});

test('a new sandbox gets sandbox.js, the page template, the sources folder, and the export, serve and sources tools', (sandbox) => {
  setup(sandbox);
  for (const file of ['sandbox.js', 'lib/sandkit/templates/page.html', 'lib/sandkit/tools/export.mjs', 'lib/sandkit/tools/serve.mjs', 'lib/sandkit/tools/sources.mjs', 'lib/sandkit/shell/sb-highlighting.js', 'sources/catalogue.json', 'sources/inbox/.gitkeep', 'lib/sandkit/shell/sb-export.js']) {
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
  assert(!result.ok && result.output.includes('no component, engine or mechanism called sb-nothing'), 'explains');
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

// Pretends the sandbox was last set up from an older Sandkit.
function installOlderSandkit(sandbox, version) {
  const source = join(sandbox, 'lib/sandkit/SOURCE.md');
  writeFileSync(source, readFileSync(source, 'utf8').replace(/^(Copied from Sandkit) \S+/m, `$1 ${version}`));
}

const rootReleases = () => readFileSync(resolve(COMPONENTS, '../CHANGELOG.md'), 'utf8').match(/^## \d+\.\d+\.\d+/gm).map((heading) => heading.slice(3));

test('updating from an older Sandkit lists the root changelog since then, and says when no part changed', (sandbox) => {
  setup(sandbox);
  const [latest, previous, older] = rootReleases();
  installOlderSandkit(sandbox, older);
  const { output } = setup(sandbox);
  assert(output.includes(`Sandkit ${older} → ${latest}`), `the move reported:\n${output}`);
  assert(output.includes(`  - ${latest}: `) && output.includes(`  - ${previous}: `), 'entries since the installed version');
  assert(!output.includes(`  - ${older}: `), 'none from the installed version');
  assert(output.includes('No component, engine or mechanism changed version.'), 'says no part moved');
  assert(!output.includes('Sandkit hasn\'t changed'), 'something did');
  assert(read(sandbox, 'lib/sandkit/SOURCE.md').includes(`Copied from Sandkit ${latest} `), 'the record moves on');
});

test('the root changelog lists breaking changes first', (sandbox) => {
  setup(sandbox);
  const oldest = rootReleases().at(-1);
  installOlderSandkit(sandbox, oldest);
  const { output } = setup(sandbox);
  assert(output.includes('    - **`sb-source-trace`:**'), 'a note\'s indented points come with it');
  const notes = output.split('\n').filter((line) => /^ {2}- \d/.test(line));
  const breaking = notes.map((line) => line.includes('**Breaking'));
  assert(breaking.includes(true), 'there are some to order');
  assert(breaking.lastIndexOf(true) < breaking.indexOf(false), 'before the rest');
});

test('updating from the same Sandkit, with nothing changed, says so', (sandbox) => {
  setup(sandbox, 'sb-log');
  const { output } = setup(sandbox);
  assert(output.includes(`Sandkit hasn\'t changed: still ${rootReleases()[0]}`), output);
  assert(!output.includes('No component, engine'), 'one statement');
});

test('a moved part is reported without saying nothing changed, and a new sandbox reports nothing', (sandbox) => {
  const created = setup(sandbox, 'sb-log').output;
  assert(!created.includes('Sandkit hasn\'t changed') && !created.includes('changed version'), `new sandbox quiet:\n${created}`);
  installOlder(sandbox, 'sb-log', '0.0.1');
  const { output } = setup(sandbox);
  assert(output.includes('sb-log 0.0.1 →') && !output.includes('Sandkit hasn\'t changed') && !output.includes('No component, engine'), output);
});

test('SOURCE.md lists versions and files in a fixed order, whatever order they were added', (sandbox) => {
  setup(sandbox, 'sb-log', 'sb-id', 'sb-store', 'discovery');
  const source = read(sandbox, 'lib/sandkit/SOURCE.md');
  const list = (from, to) => source.slice(source.indexOf(from), source.indexOf(to)).split('\n').filter((line) => line.startsWith('- ')).map((line) => line.slice(2));
  const versions = list('## Versions', '## Files').map((line) => line.split(' ')[0]);
  assertEqual(versions, ['Sandkit', 'shell', 'sb-comments', 'sb-id', 'sb-log', 'discovery', 'tags', 'sb-store']);
  const groupOf = (file) => ['shell/', 'components/', 'engines/', 'mechanisms/'].findIndex((folder) => file.startsWith(folder));
  const groups = list('## Files', '\0').map(groupOf);
  assertEqual(groups, [...groups].sort((a, b) => a - b));
  setup(sandbox);
  assertEqual(read(sandbox, 'lib/sandkit/SOURCE.md').split('## Versions')[1], source.split('## Versions')[1]);
});

test('it names the folder it updated, even when given as a dot', (sandbox) => {
  setup(sandbox);
  const output = execFileSync('node', [SETUP, '.'], { cwd: sandbox, encoding: 'utf8' });
  assert(output.startsWith(`Updated ${basename(realpathSync(sandbox))}.\n`), output);
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

test('export carries page-wide highlighting', (folder) => {
  const script = readFileSync(resolve(fileURLToPath(import.meta.url), '../../shell/sb-highlighting.js'), 'utf8');
  write(folder, 'sb-highlighting.js', script);
  write(folder, 'page.html', '<script src="sb-highlighting.js"></script>\n<p data-ref="A">A</p>');
  const { ok, output } = exportTool(join(folder, 'page.html'));
  const html = readFileSync(join(folder, 'export', 'page.html'), 'utf8');
  assert(ok, output);
  assert(html.includes('Sandkit sb-highlighting') && !html.includes('src="sb-highlighting.js"'), 'the script is inside');
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

test('sources check checks a discovery sandbox\'s excerpts, noting those superseded', (folder) => {
  sourcedSandbox(folder);
  write(folder, 'model.js', 'const MODEL = { versions: [] };');
  write(folder, 'sources/floor.png', '');
  const catalogue = JSON.parse(read(folder, 'sources/catalogue.json'));
  catalogue.sources.push({ id: 'SRC-4', title: 'Floor plan', path: 'sources/floor.png' });
  write(folder, 'sources/catalogue.json', JSON.stringify(catalogue));
  mkdirSync(join(folder, 'records'));
  write(folder, 'records/excerpts.js', `const EXCERPTS = ${JSON.stringify([
    { id: 'SRC-1.1', source: 'SRC-1', quote: 'We reorder as soon as we drop under forty' },
    { id: 'SRC-1.2', source: 'SRC-1', quote: 'we reorder at thirty' },
    { id: 'SRC-1.3', source: 'SRC-1', quote: 'we reorder at twenty', supersedes: 'SRC-1.2' },
    { id: 'SRC-4.1', source: 'SRC-4', region: [0, 0, 0.5, 0.5] },
    { id: 'SRC-4.2', source: 'SRC-4' },
    { id: 'SRC-7.1', source: 'SRC-7', quote: 'x' }
  ])};`);
  const { ok, output } = checkSources(folder);
  assert(!ok, 'fails');
  for (const line of ['SRC-1.3 quotes SRC-1, but the quote isn\'t in it: "we reorder at twenty"', 'SRC-4.2 is in an image, SRC-4, but has no region.',
    'SRC-7.1 is in SRC-7, which isn\'t in the catalogue.', 'SRC-1.2 is superseded, so not checked.']) {
    assert(output.includes(line), `reports: ${line}\n${output}`);
  }
  assertEqual(output.match(/✗/g).length, 3, output);
  assert(!output.includes('ITEMS'), 'needs no ITEMS');
});

test('sources check fails excerpts it can\'t read, rather than passing them unchecked', (folder) => {
  sourcedSandbox(folder);
  mkdirSync(join(folder, 'records'));
  write(folder, 'records/excerpts.js', 'const RECORDS = { excerpts: [] };');
  let { ok, output } = checkSources(folder);
  assert(!ok && output.includes('records/excerpts.js declares no EXCERPTS list, so no excerpts were checked.'), output);
  write(folder, 'records/excerpts.js', 'const EXCERPTS = [');
  ({ ok, output } = checkSources(folder));
  assert(!ok && output.includes('records/excerpts.js couldn\'t be loaded in Node'), output);
});

test('sources check explains a missing catalogue, and a model without items', (folder) => {
  write(folder, 'model.js', 'module.exports = {};');
  const { ok, output } = checkSources(folder);
  assert(!ok && output.includes('There\'s no sources/catalogue.json.'), output);
  assert(output.includes('model.js exports no ITEMS'), output);
});

// ---- tags.mjs ----

const TAGS_TOOL = resolve(fileURLToPath(import.meta.url), '../tags.mjs');

function tagReport(...args) {
  try {
    return { ok: true, output: execFileSync('node', [TAGS_TOOL, ...args], { encoding: 'utf8', stdio: 'pipe' }) };
  } catch (err) {
    return { ok: false, output: err.stdout + err.stderr };
  }
}

const { createTags } = createRequire(import.meta.url)('../engines/tags/tags.js');
const declareTags = (...names) => names.map((tag) => ({ tag, means: 'x' }));

// A small discovery sandbox, its claims given as lists of tags in order: CLM-1, CLM-2, …
function taggedSandbox(folder, claimTags, declared) {
  mkdirSync(join(folder, 'records'));
  write(folder, 'records/tags.js', `const TAGS = ${JSON.stringify(declared)};`);
  const claims = claimTags.map((tags, index) => ({ id: `CLM-${index + 1}`, tags }));
  write(folder, 'records/claims.js', `const CLAIMS = ${JSON.stringify(claims)};`);
}

test('tags report says how far tags reach and how well they narrow', (folder) => {
  taggedSandbox(folder, [['tides'], ['tides', 'ferries'], ['tides', 'ferries'], []], [{ tag: 'tides', means: 'x' }, { tag: 'ferries', means: 'x' }]);
  const { ok, output } = tagReport('report', folder);
  assert(ok, output);
  assert(output.includes('4 items, 2 tags in use, 2 places'), output);
  assert(output.includes('Tagged: 3 of 4 (75%).'), output);
  assert(output.includes('Narrowing: an item\'s most selective tag leaves 2.3 results on average, and its exact combination 1.7.'), output);
  assert(output.includes('Untagged (1): CLM-4.'), output);
});

test('tags report flags a preset naming a tag that is retired or was never declared, and only then', (folder) => {
  taggedSandbox(folder, [['tides'], ['tides', 'ferries']], [{ tag: 'tides', means: 'x' }, { tag: 'ferries', means: 'x' }, { tag: 'old', means: 'x', replacedBy: ['tides'] }]);
  const presets = [
    { name: 'Fine', tags: ['tides'], without: ['ferries'] },
    { name: 'Left behind', tags: ['old'], without: ['gone'] }
  ];
  write(folder, 'records/presets.js', `const TAG_PRESETS = ${JSON.stringify(presets)};`);
  const { ok, output } = tagReport('report', folder);
  assert(ok, output);
  assert(output.includes('Preset "Left behind" names old, gone, which aren\'t current tags.'), output);
  assert(!output.includes('Preset "Fine"'), output);
});

test('tags report flags tags that are too broad, crowded places and overlaps, with items to spot-check', (folder) => {
  const crowded = Array.from({ length: 8 }, () => ['tides', 'ferries']);
  const rest = Array.from({ length: 4 }, () => ['weather']);
  taggedSandbox(folder, [...crowded, ...rest], ['tides', 'ferries', 'weather'].map((tag) => ({ tag, means: 'x' })));
  const { ok, output } = tagReport('report', folder);
  assert(ok, output);
  assert(output.includes('On many items: tides is on 8 of 12 (67%)'), output);
  assert(output.includes('Crowded place: 8 items carry exactly ferries + tides.'), output);
  assert(output.includes('Overlap: 8 of the 8 items on tides also carry ferries.'), output);
  assert(output.includes('· tides: CLM-1, CLM-3, CLM-6'), output);
});

test('tags report names tags undeclared, unused, retired yet carried, or on one item', (folder) => {
  taggedSandbox(folder, [['tides', 'mink'], ['tides', 'old-word']], [
    { tag: 'tides', means: 'x' }, { tag: 'unused', means: 'x' },
    { tag: 'old-word', means: 'x', replacedBy: ['tides'] }, { tag: 'gone', means: 'x', replacedBy: [] },
  ]);
  const { output } = tagReport('report', folder);
  assert(output.includes('In use but never declared (1): mink.'), output);
  assert(output.includes('Retired but still carried (1): old-word.'), output);
  assert(output.includes('Declared but unused (1): unused.'), output);
  assert(output.includes('On one item, so it finds nothing its code wouldn\'t (2): mink, old-word.'), output);
});

test('tags report leaves out working tags and whatever is superseded', (folder) => {
  mkdirSync(join(folder, 'records'));
  write(folder, 'records/tags.js', `const TAGS = [{ tag: 'tides', means: 'x' }];`);
  write(folder, 'records/claims.js', `const CLAIMS = ${JSON.stringify([
    { id: 'CLM-1' }, { id: 'CLM-2', supersedes: 'CLM-1', tags: ['tides'], working: ['survey-week'] }, { id: 'CLM-3', tags: ['tides'] },
  ])};`);
  const { output } = tagReport('report', folder);
  assert(output.includes('2 items, 1 tag in use, 1 place '), output);
  assert(output.includes('Nothing stands out.'), output);
});

test('tags report reads the catalogue and the model\'s items, with tags.js beside the model', (folder) => {
  mkdirSync(join(folder, 'sources'));
  write(folder, 'tags.js', `const TAGS = [{ tag: 'tides', means: 'x' }];`);
  write(folder, 'sources/catalogue.json', JSON.stringify({ sources: [{ id: 'SRC-1', tags: ['tides'] }, { id: 'SRC-2', status: 'superseded' }] }));
  write(folder, 'model.js', `const ITEMS = [{ id: 'RUL-1', tags: ['tides'] }, { id: 'RUL-2' }];\nmodule.exports = { ITEMS };`);
  const { ok, output } = tagReport('report', folder);
  assert(ok, output);
  assert(output.includes('3 items, 1 tag in use'), output);
  assert(output.includes('Untagged (1): RUL-2.'), output);
});

test('tags report has no pass mark: findings still exit cleanly, and only a bad call fails', (folder) => {
  taggedSandbox(folder, [[]], []);
  assert(tagReport('report', folder).output.includes('No tags here. Tagging is opt-in'), 'should say tagging is opt-in');
  mkdirSync(join(folder, 'x'));
  taggedSandbox(join(folder, 'x'), [[], []], [{ tag: 'unused', means: 'x' }]);
  assert(tagReport('report', join(folder, 'x')).ok, 'findings should exit cleanly');
  assert(!tagReport('report').ok, 'a missing folder argument should fail');
  assert(!tagReport('report', join(folder, 'nowhere')).ok, 'a folder that does not exist should fail');
});

test('tags search lists what carries every tag, one line each with its score, then ways to narrow and widen', (folder) => {
  taggedSandbox(folder, [['tides'], ['tides', 'ferries'], ['tides', 'ferries', 'weather'], ['weather']], declareTags('tides', 'ferries', 'weather'));
  const { ok, output } = tagReport('search', folder, 'tides', 'ferries');
  assert(ok, output);
  assertEqual(output.trim().split('\n'), [
    '2 items carry tides + ferries.',
    '1.00 CLM-2 claim',
    '0.67 CLM-3 claim',
    'Narrow: +weather 1',
    'Widen: drop ferries 3 · any 3',
  ]);
});

test('tags search takes --any, --without and --limit, saying what each lacks and how many more there are', (folder) => {
  taggedSandbox(folder, [['tides'], ['tides', 'ferries'], ['weather'], ['ferries', 'gulls']], declareTags('tides', 'ferries', 'weather', 'gulls'));
  const { output } = tagReport('search', folder, '--any', 'tides', 'weather', '--without', 'ferries', '--limit', '1');
  assert(output.startsWith('2 items carry tides or weather, without ferries (showing 1–1).\n0.50 CLM-1 claim · lacks weather\n1 more: --from 2 --limit 1 for the next 1.'), output);
});

test('tags search never cuts a list short without saying so, and following its hints visits every result once', (folder) => {
  taggedSandbox(folder, Array.from({ length: 7 }, (_, index) => (index % 2 ? ['tides'] : ['tides', 'ferries'])), declareTags('tides', 'ferries'));
  const resultsIn = (output) => output.split('\n').filter((line) => /^\d\.\d\d /.test(line)).map((line) => line.split(' ')[1]);
  const everything = resultsIn(tagReport('search', folder, 'tides', '--limit', '7').output);
  assertEqual(everything.length, 7);
  for (const limit of [1, 2, 3, 6]) {
    const seen = [];
    let args = ['--limit', String(limit)];
    for (let pages = 0; args && pages < 10; pages++) {
      const { output } = tagReport('search', folder, 'tides', ...args);
      const [first] = output.split('\n');
      const page = resultsIn(output);
      seen.push(...page);
      assert(first.includes(`(showing ${seen.length - page.length + 1}–${seen.length})`), `says what's shown: ${first}`);
      const next = output.match(/^\d+ more: (--from \d+(?: --limit \d+)?) for the next \d+\.$/m);
      assert(Boolean(next) === seen.length < 7, `says there are more exactly when there are:\n${output}`);
      args = next?.[1].split(' ');
    }
    assertEqual(seen, everything, `pages of ${limit}`);
  }
  const past = tagReport('search', folder, 'tides', '--from', '9').output;
  assert(past.startsWith('7 items carry tides (showing none: there are only 7).'), past);
  assert(!tagReport('search', folder, 'tides', '--from', '0').ok, 'a bad --from should fail');
});

test('tags search runs a preset, follows a retired tag, and names one never declared', (folder) => {
  taggedSandbox(folder, [['tides'], ['tides', 'ferries']], [...declareTags('tides', 'ferries'), { tag: 'sailings', means: 'x', replacedBy: ['ferries'] }]);
  write(folder, 'records/presets.js', `const TAG_PRESETS = ${JSON.stringify([{ name: 'Old sailings', asks: 'x', tags: ['sailings', 'otters'], match: 'any' }])};`);
  const { ok, output } = tagReport('search', folder, '--preset', 'Old sailings');
  assert(ok && output.startsWith('1 item carries ferries or otters.'), output);
  assert(output.includes('Followed: sailings → ferries.') && output.includes('Never declared: otters.'), output);
  assert(!tagReport('search', folder, '--preset', 'Nope').ok, 'an unknown preset should fail');
});

test('tags search --like lists what shares tags with some items, naming the closest when given several', (folder) => {
  taggedSandbox(folder, [['tides'], ['tides', 'ferries'], ['ferries'], ['weather']], declareTags('tides', 'ferries', 'weather'));
  const { output } = tagReport('search', folder, '--like', 'CLM-1', 'CLM-3', 'CLM-99');
  assertEqual(output.trim().split('\n'), [
    '1 item shares tags with CLM-1, CLM-3, CLM-99, closest first.',
    '0.50 CLM-2 claim · shares tides with CLM-1',
    'Not found: CLM-99.',
  ]);
});

test('tags search says when several carry exactly the chosen tags, so a run of 1.00 in code order reads as meant', (folder) => {
  taggedSandbox(folder, [['tides', 'ferries'], ['tides', 'ferries'], ['tides', 'ferries', 'weather']], declareTags('tides', 'ferries', 'weather'));
  const [first] = tagReport('search', folder, 'tides', 'ferries').output.split('\n');
  assertEqual(first, '3 items carry tides + ferries. 2 carry exactly these and no other tag, so they score 1.00, in code order.');
  assertEqual(tagReport('search', folder, 'weather').output.split('\n')[0], '1 item carries weather.');
});

test('tags search labels an observation by what it\'s of', (folder) => {
  mkdirSync(join(folder, 'records'));
  write(folder, 'records/tags.js', `const TAGS = [{ tag: 'tides', means: 'x' }];`);
  write(folder, 'records/observations.js', `const OBSERVATIONS = [{ id: 'OBS-1', tags: ['tides'], value: '3', of: 'Late ferries' }];`);
  assert(tagReport('search', folder, 'tides').output.includes('1.00 OBS-1 observation · Late ferries'), 'labelled');
});

test('tags search shows a short label, kind and status, never the record itself', (folder) => {
  mkdirSync(join(folder, 'records'));
  write(folder, 'records/tags.js', `const TAGS = [{ tag: 'tides', means: 'x' }];`);
  write(folder, 'records/entities.js', `const ENTITIES = [{ id: 'ENT-1', tags: ['tides'], status: 'proposed', name: 'Tide table', notes: 'secret body' }];`);
  write(folder, 'records/claims.js', `const CLAIMS = [{ id: 'CLM-1', tags: ['tides'], text: '${'Spring tides '.repeat(10)}' }];`);
  const { output } = tagReport('search', folder, 'tides');
  assert(output.includes('1.00 ENT-1 entity, proposed · Tide table'), output);
  assert(!output.includes('secret body'), 'a record body leaked');
  const long = output.split('\n').find((line) => line.includes('CLM-1'));
  assert(long.endsWith('…') && long.length < 100, `a long text is cut short: ${long}`);
});

test('tags search gives the agent exactly what the engine gives a page, for the same records', (folder) => {
  const claims = [['tides'], ['tides', 'ferries'], ['ferries', 'weather'], ['weather'], ['tides', 'weather'], ['ferries']];
  taggedSandbox(folder, claims, declareTags('tides', 'ferries', 'weather'));
  const engine = createTags({ items: claims.map((tags, index) => ({ id: `CLM-${index + 1}`, tags })), tags: declareTags('tides', 'ferries', 'weather') });
  const fromPage = engine.find({ tags: ['tides', 'weather'], match: 'any' }).results.map(({ id, score }) => `${score.toFixed(2)} ${id}`);
  const fromAgent = tagReport('search', folder, '--any', 'tides', 'weather').output.split('\n').filter((line) => /^\d\.\d\d /.test(line)).map((line) => line.split(' ').slice(0, 2).join(' '));
  assertEqual(fromAgent, fromPage);
});

test('tags search fails only when it can\'t run: finding nothing is an answer', (folder) => {
  taggedSandbox(folder, [['tides']], declareTags('tides'));
  const nothing = tagReport('search', folder, 'otters');
  assert(nothing.ok && nothing.output.startsWith('Nothing carries otters.'), nothing.output);
  assert(!tagReport('search', folder).ok, 'nothing asked should fail');
  assert(!tagReport('search', folder, '--limit', 'x', 'tides').ok, 'a bad limit should fail');
  assert(!tagReport('search', folder, '--sideways').ok, 'an unknown option should fail');
});

test('a new sandbox gets the tags tool and the tags engine it runs on, recorded with its version', (sandbox) => {
  setup(sandbox);
  for (const file of ['tools/tags.mjs', 'engines/tags/tags.js', 'engines/tags/manifest.md', 'engines/tags/CHANGELOG.md']) assert(existsSync(join(sandbox, 'lib/sandkit', file)), `missing ${file}`);
  assert(/- tags \d+\.\d+\.\d+/.test(read(sandbox, 'lib/sandkit/SOURCE.md')), 'its version recorded');
  assert(!read(sandbox, 'index.html').includes('engines/tags'), 'no script tag unless asked for');
  mkdirSync(join(sandbox, 'x'));
  taggedSandbox(join(sandbox, 'x'), [['tides']], declareTags('tides'));
  const run = execFileSync('node', [join(sandbox, 'lib/sandkit/tools/tags.mjs'), 'search', join(sandbox, 'x'), 'tides'], { encoding: 'utf8' });
  assert(run.startsWith('1 item carries tides.'), `the copied tool runs: ${run}`);
});
