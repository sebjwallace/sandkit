#!/usr/bin/env node
// Sets up a sandbox with Sandkit's files, or updates them. No dependencies: just Node.
//
//   node tools/setup.mjs path/to/sandbox sb-id sb-log
//   node tools/setup.mjs path/to/sandbox discovery                   an engine, named by its folder
//   node tools/setup.mjs path/to/sandbox sb-store                    a mechanism, named by its folder
//   node tools/setup.mjs path/to/sandbox sb-log --page stock.html    tags go on another page
//
// - A folder without an index.html starts from the template. Existing files are never overwritten.
// - A sandbox without CLAUDE.md gets the template's, so agents that read only that file still find AGENTS.md.
// - The one exception to never overwriting: the catalog's Find by need index is kept current in the sandbox's AGENTS.md,
//   between <!-- sandkit:find-by-need --> markers. Only what's between them is replaced; without them (an older sandbox),
//   the block is added at the end of the Sandkit components section, or of the file. Nothing outside it changes.
// - Copies the shell, the catalog, the style guide, the practices, the page template, the export, serve and sources tools, sb-comments
//   (the template's comment mode), and each named component, engine or mechanism (plus any the sandbox already has) into lib/sandkit/,
//   keeping Sandkit's paths, with their manifests and changelogs.
// - Adds a script tag to index.html, or the page named, for each component, engine or mechanism named that doesn't have one yet:
//   a mechanism's before model.js's, since the model needs it when it loads, and the rest after the last Sandkit script.
// - Writes lib/sandkit/SOURCE.md, recording every version.
// - When updating, reports what changed since the installed versions, breaking changes first.
// - A retired component a sandbox still has is left as it is, with a note of what replaces it.
//
// Running it again refreshes every copy, so setting up, adding and updating are the same command.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SANDKIT = resolve(fileURLToPath(import.meta.url), '../..');
const REPOSITORY = 'https://github.com/sebjwallace/sandkit';
const EVERY_SANDBOX = ['sb-comments']; // components the template uses
// Components Sandkit no longer has, and what replaces each. See CHANGELOG.md for how to move.
const RETIRED = { 'sb-discovery-board': 'sb-lineage', 'sb-source-trace': 'sb-lineage' };
const ALWAYS_COPIED = ['CATALOG.md', 'CHANGELOG.md', 'STYLE.md', 'shell/sb-theme-settings.js', 'shell/sb-shell.js', 'shell/sb-export.js', 'shell/manifest.md', 'shell/CHANGELOG.md', 'templates/page.html', 'tools/export.mjs', 'tools/serve.mjs', 'tools/sources.mjs'];

function setup(folder, requested, page = 'index.html') {
  const sandbox = resolve(folder);
  const lib = join(sandbox, 'lib', 'sandkit');
  requested.forEach(checkAvailable);

  const isNew = !existsSync(join(sandbox, 'index.html'));
  if (isNew) cpSync(join(SANDKIT, 'templates', 'sandbox'), sandbox, { recursive: true, force: false });
  addAgentPointer(sandbox);
  const indexChanged = refreshFindByNeed(join(sandbox, 'AGENTS.md'));
  if (!existsSync(join(sandbox, page))) fail(`${folder} has no page called ${page}. Start one from lib/sandkit/templates/page.html.`);

  const kept = installedIn(lib, 'components').filter((name) => RETIRED[name]);
  const components = [...new Set([...EVERY_SANDBOX, ...installedIn(lib, 'components'), ...requested.filter((name) => kindOf(name) === 'components')])]
    .filter((name) => !RETIRED[name]);
  const engines = [...new Set([...installedIn(lib, 'engines'), ...requested.filter(isEngine)])];
  const mechanisms = [...new Set([...installedIn(lib, 'mechanisms'), ...requested.filter(isMechanism)])];
  const packages = ['shell', ...components, ...engines, ...mechanisms].map(packageOf);
  const installed = Object.fromEntries(packages.map((p) => [p.name, versionIn(join(lib, p.script))]));

  const files = [...ALWAYS_COPIED, ...practices(), ...[...components, ...engines, ...mechanisms].flatMap(filesOf)];
  for (const file of files) {
    mkdirSync(dirname(join(lib, file)), { recursive: true });
    cpSync(join(SANDKIT, file), join(lib, file));
  }
  const tagged = addScriptTags(join(sandbox, page), requested);
  const versions = packages.map((p) => ({ ...p, from: installed[p.name], to: versionIn(join(SANDKIT, p.script)) }));
  writeFileSync(join(lib, 'SOURCE.md'), sourceRecord(files, versions));

  console.log(isNew ? `Created ${folder} from the template.` : `Updated ${folder}.`);
  const parts = [...components, ...engines.map((name) => `the ${name} engine`), ...mechanisms.map((name) => `the ${name} mechanism`)];
  console.log(`Copied ${files.length} files into lib/sandkit/${parts.length ? `, with ${parts.join(', ')}` : ''}.`);
  if (indexChanged && !isNew) console.log('Refreshed the Find by need index in AGENTS.md.');
  if (tagged.added.length) console.log(`Added script tags for ${tagged.added.join(', ')} to ${page}.`);
  if (tagged.missing.length) console.log(`Add script tags for ${tagged.missing.join(', ')} to ${page} yourself: no Sandkit script tag was found to place them after.`);
  reportChanges(versions.filter((v) => v.from && v.from !== v.to));
  for (const name of kept) console.log(`${name} is retired from Sandkit, so lib/sandkit/components/${name} is left as it is. Move to ${RETIRED[name]} when you're ready: Sandkit's CHANGELOG.md says how.`);
}

// ---- What to copy ----

// Every part is named by its folder: a component's is its tag, a mechanism's its sb- name, an engine's its method.
const KINDS = ['components', 'engines', 'mechanisms'];
const kindsOf = (name) => KINDS.filter((kind) => existsSync(join(SANDKIT, kind, name)));
const kindOf = (name) => kindsOf(name)[0] ?? 'components';
const isEngine = (name) => kindOf(name) === 'engines';
const isMechanism = (name) => kindOf(name) === 'mechanisms';

// Only parts with a manifest are ready for sandboxes; the rest are still in progress.
function checkAvailable(name) {
  if (RETIRED[name]) fail(`${name} is retired from Sandkit. Use ${RETIRED[name]} instead: see CATALOG.md.`);
  if (kindsOf(name).length > 1) fail(`${name} is in more than one of Sandkit's ${kindsOf(name).join(' and ')}, so it can't tell which you mean. Rename one of them.`);
  const folder = join(SANDKIT, kindOf(name), name);
  if (existsSync(join(folder, 'manifest.md'))) return;
  if (existsSync(folder)) fail(`${name} is still in progress (see CATALOG.md), so it can't be set up yet.`);
  fail(`Sandkit has no component, engine or mechanism called ${name}. See CATALOG.md for what's available.`);
}

function installedIn(lib, kind) {
  const folder = join(lib, kind);
  return existsSync(folder) ? readdirSync(folder).filter((name) => !name.startsWith('.')) : [];
}

const practices = () => readdirSync(join(SANDKIT, 'practices')).map((file) => `practices/${file}`);
const scriptOf = (name) => `${kindOf(name)}/${name}/${name}.js`;
const filesOf = (name) => [scriptOf(name), `${kindOf(name)}/${name}/manifest.md`, `${kindOf(name)}/${name}/CHANGELOG.md`];

// Sandboxes set up before the template had CLAUDE.md get it now; one already there is the sandbox's own.
function addAgentPointer(sandbox) {
  const pointer = join(sandbox, 'CLAUDE.md');
  if (!existsSync(pointer)) cpSync(join(SANDKIT, 'templates', 'sandbox', 'CLAUDE.md'), pointer);
}

// ---- The Find by need index ----
// Copied into the sandbox's AGENTS.md so it's in front of the agent whenever it chooses a part.

const INDEX_START = '<!-- sandkit:find-by-need -->';
const INDEX_END = '<!-- /sandkit:find-by-need -->';

// The body of the catalog's Find by need section, without its heading.
function findByNeed() {
  const catalog = readFileSync(join(SANDKIT, 'CATALOG.md'), 'utf8');
  return catalog.match(/^## Find by need\n+([\s\S]*?)\n+^## /m)[1];
}

// Returns whether AGENTS.md changed.
function refreshFindByNeed(agentsPath) {
  if (!existsSync(agentsPath)) return false;
  const text = readFileSync(agentsPath, 'utf8');
  const updated = withIndex(text, `${INDEX_START}\n${findByNeed()}\n${INDEX_END}`);
  if (updated !== text) writeFileSync(agentsPath, updated);
  return updated !== text;
}

// Replaces the block between the markers, or adds it at the end of the Sandkit components section, or of the file.
function withIndex(text, block) {
  const start = text.indexOf(INDEX_START);
  const end = text.indexOf(INDEX_END);
  if (start >= 0 && end > start) return text.slice(0, start) + block + text.slice(end + INDEX_END.length);

  const section = text.indexOf('\n## Sandkit components');
  const nextSection = section < 0 ? -1 : text.indexOf('\n## ', section + 1);
  const at = nextSection < 0 ? text.length : nextSection;
  const before = text.slice(0, at);
  return `${before}${before.endsWith('\n') ? '\n' : '\n\n'}${block}\n${text.slice(at)}`;
}

// ---- Script tags ----

// Matches script tags that stand on their own line, so commented-out examples don't count.
const SANDKIT_TAG = /^([ \t]*)<script src="(lib\/sandkit\/[^"]+)"><\/script>$/gm;

const MODEL_TAG = /^([ \t]*)<script src="model\.js"><\/script>$/m;

// A mechanism's tag goes just before model.js's, since the model needs it when it loads.
// Other tags, and a mechanism's on a page without the model, go after the last Sandkit script tag,
// so they load after the shell.
function addScriptTags(indexPath, parts) {
  let html = readFileSync(indexPath, 'utf8');
  const added = [], missing = [];
  for (const name of parts) {
    const src = `lib/sandkit/${scriptOf(name)}`;
    const tags = [...html.matchAll(SANDKIT_TAG)];
    if (tags.some((tag) => tag[2] === src)) continue;
    const modelTag = isMechanism(name) && html.match(MODEL_TAG);
    const lastTag = tags.at(-1);
    if (modelTag) html = `${html.slice(0, modelTag.index)}${modelTag[1]}<script src="${src}"></script>\n${html.slice(modelTag.index)}`;
    else if (lastTag) html = `${html.slice(0, lastTag.index + lastTag[0].length)}\n${lastTag[1]}<script src="${src}"></script>${html.slice(lastTag.index + lastTag[0].length)}`;
    else { missing.push(name); continue; }
    added.push(name);
  }
  writeFileSync(indexPath, html);
  return { added, missing };
}

// ---- Versions ----
// A component's, engine's or mechanism's version is the top entry of its changelog, repeated in its script's first line
// ("// Sandkit sb-log 0.1.0 · …"), so a copied script always says what it is. The shell's two
// scripts share one version.

const packageOf = (name) => (name === 'shell'
  ? { name: 'shell', script: 'shell/sb-shell.js', changelog: 'shell/CHANGELOG.md' }
  : { name, script: scriptOf(name), changelog: scriptOf(name).replace(/[^/]+\.js$/, 'CHANGELOG.md') });

function versionIn(scriptPath) {
  if (!existsSync(scriptPath)) return null;
  return readFileSync(scriptPath, 'utf8').match(/^\/\/ Sandkit \S+ (\d+\.\d+\.\d+) /)?.[1] ?? null;
}

// [{ version, notes }] from a changelog's "## 1.2.3 · date" headings and the "- " lines under them.
function releases(changelogPath) {
  const result = [];
  for (const line of readFileSync(changelogPath, 'utf8').split('\n')) {
    const heading = line.match(/^## (\d+\.\d+\.\d+)/);
    if (heading) result.push({ version: heading[1], notes: [] });
    else if (line.startsWith('- ') && result.length) result.at(-1).notes.push(line.slice(2));
  }
  return result;
}

function compareVersions(a, b) {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

// Lists what changed since each installed version, breaking changes first, so whoever updates
// the sandbox knows what to migrate.
function reportChanges(updated) {
  let anyBreaking = false;
  for (const { name, changelog, from, to } of updated) {
    const notes = releases(join(SANDKIT, changelog))
      .filter((r) => compareVersions(r.version, from) > 0 && compareVersions(r.version, to) <= 0)
      .flatMap((r) => r.notes.map((note) => `${r.version}: ${note}`));
    const isBreaking = (note) => note.includes('**Breaking:**');
    anyBreaking ||= notes.some(isBreaking);
    console.log(`\n${name} ${from} → ${to}`);
    for (const note of [...notes.filter(isBreaking), ...notes.filter((n) => !isBreaking(n))]) console.log(`  - ${note}`);
  }
  if (anyBreaking) console.log('\nBreaking changes are listed first. Each says how to migrate: apply them before using the sandbox.');
}

const sandkitVersion = () => releases(join(SANDKIT, 'CHANGELOG.md'))[0]?.version ?? 'unknown';

// ---- The source record ----

function sourceRecord(files, versions) {
  const date = new Date().toISOString().slice(0, 10);
  return [
    '# Source',
    '',
    `Copied from Sandkit ${sandkitVersion()} (${REPOSITORY}) at commit ${currentCommit()}, on ${date}, by tools/setup.mjs.`,
    'To update, copy these files again from a newer Sandkit, keeping their paths, and read each changelog for what changed since the versions below.',
    '',
    '## Versions',
    '',
    `- Sandkit ${sandkitVersion()}`,
    ...versions.map((v) => `- ${v.name} ${v.to}`),
    '',
    '## Files',
    '',
    ...files.map((file) => `- ${file}`),
    ''
  ].join('\n');
}

function currentCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: SANDKIT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unknown';
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const pageAt = args.indexOf('--page');
const page = pageAt >= 0 ? args.splice(pageAt, 2)[1] : 'index.html';
const [folder, ...requested] = args;
if (!folder || !page) fail('Usage: node tools/setup.mjs <sandbox-folder> [component, engine or mechanism ...] [--page <page.html>]');
setup(folder, requested, page);
