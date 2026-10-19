#!/usr/bin/env node
// Sets up a sandbox with Sandkit's files, or updates them. No dependencies: just Node.
//
//   node tools/setup.mjs path/to/sandbox sb-id sb-log
//   node tools/setup.mjs path/to/sandbox sb-log --page stock.html    tags go on another page
//
// - A folder without an index.html starts from the template. Existing files are never overwritten.
// - Copies the shell, the catalog, the practices, the page template, the export, serve and sources tools, sb-comments
//   (the template's comment mode), and each named component (plus any the sandbox already has) into lib/sandkit/, keeping Sandkit's paths, with
//   their changelogs.
// - Adds a script tag to index.html, or the page named, for each component named that doesn't have one yet.
// - Writes lib/sandkit/SOURCE.md, recording every version.
// - When updating, reports what changed since the installed versions, breaking changes first.
//
// Running it again refreshes every copy, so setting up, adding and updating are the same command.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SANDKIT = resolve(fileURLToPath(import.meta.url), '../..');
const REPOSITORY = 'https://github.com/sebjwallace/sandkit';
const EVERY_SANDBOX = ['sb-comments']; // components the template uses
const ALWAYS_COPIED = ['CATALOG.md', 'CHANGELOG.md', 'shell/sb-theme-settings.js', 'shell/sb-shell.js', 'shell/sb-export.js', 'shell/manifest.md', 'shell/CHANGELOG.md', 'templates/page.html', 'tools/export.mjs', 'tools/serve.mjs', 'tools/sources.mjs'];

function setup(folder, requested, page = 'index.html') {
  const sandbox = resolve(folder);
  const lib = join(sandbox, 'lib', 'sandkit');
  requested.forEach(checkAvailable);

  const isNew = !existsSync(join(sandbox, 'index.html'));
  if (isNew) cpSync(join(SANDKIT, 'templates', 'sandbox'), sandbox, { recursive: true, force: false });
  if (!existsSync(join(sandbox, page))) fail(`${folder} has no page called ${page}. Start one from lib/sandkit/templates/page.html.`);

  const components = [...new Set([...EVERY_SANDBOX, ...componentsIn(lib), ...requested])];
  const packages = ['shell', ...components].map(packageOf);
  const installed = Object.fromEntries(packages.map((p) => [p.name, versionIn(join(lib, p.script))]));

  const files = [...ALWAYS_COPIED, ...practices(), ...components.flatMap(componentFiles)];
  for (const file of files) {
    mkdirSync(dirname(join(lib, file)), { recursive: true });
    cpSync(join(SANDKIT, file), join(lib, file));
  }
  const tagged = addScriptTags(join(sandbox, page), requested);
  const versions = packages.map((p) => ({ ...p, from: installed[p.name], to: versionIn(join(SANDKIT, p.script)) }));
  writeFileSync(join(lib, 'SOURCE.md'), sourceRecord(files, versions));

  console.log(isNew ? `Created ${folder} from the template.` : `Updated ${folder}.`);
  console.log(`Copied ${files.length} files into lib/sandkit/${components.length ? `, with ${components.join(', ')}` : ''}.`);
  if (tagged.added.length) console.log(`Added script tags for ${tagged.added.join(', ')} to ${page}.`);
  if (tagged.missing.length) console.log(`Add script tags for ${tagged.missing.join(', ')} to ${page} yourself: no Sandkit script tag was found to place them after.`);
  reportChanges(versions.filter((v) => v.from && v.from !== v.to));
}

// ---- What to copy ----

// Only components with a manifest are ready for sandboxes; the rest are still in progress.
function checkAvailable(name) {
  const folder = join(SANDKIT, 'components', name);
  if (existsSync(join(folder, 'manifest.md'))) return;
  if (existsSync(folder)) fail(`${name} is still in progress (see CATALOG.md), so it can't be set up yet.`);
  fail(`Sandkit has no component called ${name}. See CATALOG.md for what's available.`);
}

function componentsIn(lib) {
  const folder = join(lib, 'components');
  return existsSync(folder) ? readdirSync(folder) : [];
}

const practices = () => readdirSync(join(SANDKIT, 'practices')).map((file) => `practices/${file}`);
const componentFiles = (name) => [`components/${name}/${name}.js`, `components/${name}/manifest.md`, `components/${name}/CHANGELOG.md`];

// ---- Script tags ----

// Matches script tags that stand on their own line, so commented-out examples don't count.
const SANDKIT_TAG = /^([ \t]*)<script src="(lib\/sandkit\/[^"]+)"><\/script>$/gm;

// New tags go after the last Sandkit script tag, so they load after the shell.
function addScriptTags(indexPath, components) {
  let html = readFileSync(indexPath, 'utf8');
  const added = [], missing = [];
  for (const name of components) {
    const src = `lib/sandkit/components/${name}/${name}.js`;
    const tags = [...html.matchAll(SANDKIT_TAG)];
    if (tags.some((tag) => tag[2] === src)) continue;
    const lastTag = tags.at(-1);
    if (!lastTag) { missing.push(name); continue; }
    const end = lastTag.index + lastTag[0].length;
    html = `${html.slice(0, end)}\n${lastTag[1]}<script src="${src}"></script>${html.slice(end)}`;
    added.push(name);
  }
  writeFileSync(indexPath, html);
  return { added, missing };
}

// ---- Versions ----
// A component's version is the top entry of its changelog, repeated in its script's first line
// ("// Sandkit sb-log 0.1.0 · …"), so a copied script always says what it is. The shell's two
// scripts share one version.

const packageOf = (name) => (name === 'shell'
  ? { name: 'shell', script: 'shell/sb-shell.js', changelog: 'shell/CHANGELOG.md' }
  : { name, script: `components/${name}/${name}.js`, changelog: `components/${name}/CHANGELOG.md` });

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
if (!folder || !page) fail('Usage: node tools/setup.mjs <sandbox-folder> [component ...] [--page <page.html>]');
setup(folder, requested, page);
