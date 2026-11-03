// Mechanisms are pure, know nothing of Sandkit, and load in Node as they do in a page.
// Plain assertions, no libraries. The page half of loading is test.html, beside this.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const FIXTURE = join(ROOT, 'tools/fixtures/mechanism');

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { console.log(`✗ ${name} — ${err.message}`); process.exitCode = 1; }
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const read = (path) => readFileSync(path, 'utf8');

// Folders only, so .gitkeep or a stray file never counts as a mechanism.
const folders = (kind) => readdirSync(join(ROOT, kind), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).map((entry) => entry.name);

// A mechanism's one global is its name in capitals: sb-store → SbStore, sb-ageing-store → SbAgeingStore.
const globalOf = (name) => name.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join('');

const MECHANISMS = folders('mechanisms');
const ENGINES = folders('engines');

// ---- The purity check ----

// What a pure mechanism has no business touching: the page, storage, the network, the clock,
// randomness, timers, globals and other files.
const FORBIDDEN = ['document', 'window', 'globalThis', 'fetch', 'localStorage', 'sessionStorage', 'indexedDB',
  'Date', 'performance', 'setTimeout', 'setInterval', 'require', 'import', 'Math.random'];

// Comments may say anything, and strings hold names such as a 'sliding-window' policy.
const withoutComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const withoutStrings = (code) => code.replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, "''");

const mentions = (text, word) => new RegExp(`(^|[^\\w$.])${word.replace('.', '\\.')}(?![\\w$])`).test(text);
const topLevelNames = (code) => [...code.matchAll(/^(?:const|let|var|class|(?:async\s+)?function\*?)\s+([\w$]+)/gm)].map((m) => m[1]);

// Every way a mechanism's script breaks the rules, in words. Empty when it's pure.
function problemsIn(source, name, { engines = ENGINES, mechanisms = MECHANISMS } = {}) {
  const code = withoutComments(source);
  const bare = withoutStrings(code);
  const own = globalOf(name);
  const problems = [];
  for (const word of FORBIDDEN) if (mentions(bare, word)) problems.push(`uses ${word}`);
  if (/(^|[^\w-])sb-[a-z]/.test(code)) problems.push('names a Sandkit component or mechanism');
  for (const engine of engines) if (code.toLowerCase().includes(engine)) problems.push(`names the ${engine} engine`);
  for (const other of mechanisms.filter((m) => m !== name)) if (mentions(code, globalOf(other))) problems.push(`names the ${other} mechanism`);
  const names = topLevelNames(bare);
  if (names.length !== 1 || names[0] !== own) problems.push(`declares ${names.join(', ') || 'nothing'} rather than just ${own}`);
  if (!code.includes(`if (typeof module !== 'undefined') module.exports = ${own};`)) problems.push(`doesn't end by exporting ${own} for Node`);
  return problems;
}

test('every mechanism carries the sb- prefix, and no name is both a component and a mechanism', () => {
  const unprefixed = MECHANISMS.filter((name) => !name.startsWith('sb-'));
  const shared = MECHANISMS.filter((name) => folders('components').includes(name));
  assert(!unprefixed.length, `without the sb- prefix: ${unprefixed.join(', ')}`);
  assert(!shared.length, `both a component and a mechanism: ${shared.join(', ')}`);
});

for (const name of MECHANISMS) {
  test(`${name} is pure, knows nothing of Sandkit, and declares only ${globalOf(name)}`, () => {
    const problems = problemsIn(read(join(ROOT, 'mechanisms', name, `${name}.js`)), name);
    assert(!problems.length, problems.join('; '));
  });
}

// The check itself, against the fixture mechanism: clean as it is, and broken one rule at a time.
const tally = read(join(FIXTURE, 'lib/sandkit/mechanisms/sb-tally/sb-tally.js'));
const broken = (from, to) => { assert(tally.includes(from), `the fixture has no "${from}" to break`); return tally.replace(from, to); };
const fixtureProblems = (source) => problemsIn(source, 'sb-tally', { engines: ['discovery'], mechanisms: ['sb-tally', 'sb-store'] });

test('the purity check passes the fixture mechanism as it is', () => {
  const problems = fixtureProblems(tally);
  assert(!problems.length, problems.join('; '));
});

test('the purity check ignores comments and strings', () => {
  const source = broken('const create =', "// a time window, the due date, document it\n  const policies = ['sliding-window'];\n  const create =");
  const problems = fixtureProblems(source).filter((p) => p.startsWith('uses'));
  assert(!problems.length, problems.join('; '));
});

const BREAKS = [
  ['the page', 'document.title', 'uses document'],
  ['the window', 'window.innerWidth', 'uses window'],
  ['a global of its own', 'globalThis.x', 'uses globalThis'],
  ['the network', 'fetch(amount)', 'uses fetch'],
  ['storage', 'localStorage.length', 'uses localStorage'],
  ['the clock', 'Date.now()', 'uses Date'],
  ['the clock, precisely', 'performance.now()', 'uses performance'],
  ['a timer', 'setTimeout(create)', 'uses setTimeout'],
  ['randomness', 'Math.random()', 'uses Math.random'],
  ['another file', "require('x')", 'uses require'],
  ['a module', "import('x')", 'uses import'],
  ['a component', "'sb-log'", 'names a Sandkit component or mechanism'],
  ['an engine', 'createDiscovery()', 'names the discovery engine'],
  ['another mechanism', 'SbStore.fill(tally)', 'names the sb-store mechanism']
];

for (const [what, expression, problem] of BREAKS) {
  test(`the purity check catches a mechanism touching ${what}`, () => {
    const problems = fixtureProblems(broken('const added =', `${expression};\n    const added =`));
    assert(problems.includes(problem), `expected "${problem}", got: ${problems.join('; ') || 'nothing'}`);
  });
}

test('the purity check catches a second global', () => {
  const problems = fixtureProblems(`${tally}\nconst helper = 1;\n`);
  assert(problems.some((p) => p.startsWith('declares')), problems.join('; ') || 'nothing');
});

test('the purity check catches a global not named after the mechanism', () => {
  const problems = fixtureProblems(tally.replaceAll('SbTally', 'SbCounter'));
  assert(problems.some((p) => p.startsWith('declares')), problems.join('; ') || 'nothing');
});

test('the purity check catches a mechanism that isn\'t exported for Node', () => {
  const problems = fixtureProblems(broken("if (typeof module !== 'undefined') module.exports = SbTally;", ''));
  assert(problems.some((p) => p.startsWith('doesn\'t end')), problems.join('; ') || 'nothing');
});

// ---- Isolation, the other way round ----
// Components and engines never name a mechanism, and a mechanism's manifest names no other part.

const filesOf = (kind, name, files) => files.map((file) => join(ROOT, kind, name, file)).filter(existsSync);
const OTHER_PARTS = [
  ...folders('components').flatMap((name) => filesOf('components', name, [`${name}.js`, 'manifest.md', 'demo.html'])),
  ...ENGINES.flatMap((name) => filesOf('engines', name, [`${name}.js`, 'manifest.md']))
];
const partsNaming = (word) => OTHER_PARTS.filter((file) => mentions(read(file), word));

test('the isolation check finds a word in components and engines', () => {
  assert(partsNaming('HTMLElement').length > 10, 'it should find HTMLElement in many components');
});

for (const name of MECHANISMS) {
  test(`no component or engine names ${name}`, () => {
    const files = [...new Set([...partsNaming(globalOf(name)), ...partsNaming(name)])];
    assert(!files.length, files.join(', '));
  });

  test(`${name}'s manifest names no component, engine or other mechanism`, () => {
    const manifest = read(join(ROOT, 'mechanisms', name, 'manifest.md'));
    const named = [
      ...(/(^|[^\w-])sb-[a-z]/.test(manifest) ? ['a component'] : []),
      ...ENGINES.filter((engine) => mentions(manifest, engine)),
      ...MECHANISMS.filter((other) => other !== name && mentions(manifest, globalOf(other)))
    ];
    assert(!named.length, `names ${named.join(', ')}`);
  });
}

// ---- Loading in Node ----
// The model finds the mechanism the same way in a page (test.html) and here.

test('a model loads its mechanism for itself under Node', () => {
  const { createModel } = createRequire(import.meta.url)(join(FIXTURE, 'model.js'));
  const model = createModel();
  assert(model.stock(5) === 2 && model.onShelf === 3, 'three fit and two are turned away');
});
