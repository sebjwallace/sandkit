#!/usr/bin/env node
// Sets up a sandbox with Sandkit's files, or updates them. No dependencies: just Node.
//
//   node tools/setup.mjs path/to/sandbox sb-id sb-log
//
// - A folder without an index.html starts from the template. Existing files are never overwritten.
// - Copies the shell, the catalog, the practices, and each named component (plus any the sandbox
//   already has) into lib/sandkit/, keeping Sandkit's paths.
// - Adds a script tag to index.html for each component that doesn't have one yet.
// - Writes lib/sandkit/SOURCE.md.
//
// Running it again refreshes every copy, so setting up, adding and updating are the same command.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SANDKIT = resolve(fileURLToPath(import.meta.url), '../..');
const REPOSITORY = 'https://github.com/sebjwallace/sandkit';
const ALWAYS_COPIED = ['CATALOG.md', 'shell/sb-theme-settings.js', 'shell/sb-shell.js', 'shell/manifest.md'];

function setup(folder, requested) {
  const sandbox = resolve(folder);
  const lib = join(sandbox, 'lib', 'sandkit');
  requested.forEach(checkAvailable);

  const isNew = !existsSync(join(sandbox, 'index.html'));
  if (isNew) cpSync(join(SANDKIT, 'templates', 'sandbox'), sandbox, { recursive: true, force: false });

  const components = [...new Set([...componentsIn(lib), ...requested])];
  const files = [...ALWAYS_COPIED, ...practices(), ...components.flatMap(componentFiles)];
  for (const file of files) {
    mkdirSync(dirname(join(lib, file)), { recursive: true });
    cpSync(join(SANDKIT, file), join(lib, file));
  }
  const tagged = addScriptTags(join(sandbox, 'index.html'), components);
  writeFileSync(join(lib, 'SOURCE.md'), sourceRecord(files));

  console.log(isNew ? `Created ${folder} from the template.` : `Updated ${folder}.`);
  console.log(`Copied ${files.length} files into lib/sandkit/${components.length ? `, with ${components.join(', ')}` : ''}.`);
  if (tagged.added.length) console.log(`Added script tags for ${tagged.added.join(', ')} to index.html.`);
  if (tagged.missing.length) console.log(`Add script tags for ${tagged.missing.join(', ')} to index.html yourself: no Sandkit script tag was found to place them after.`);
}

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
const componentFiles = (name) => [`components/${name}/${name}.js`, `components/${name}/manifest.md`];

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

function sourceRecord(files) {
  const date = new Date().toISOString().slice(0, 10);
  return [
    '# Source',
    '',
    `Copied from Sandkit (${REPOSITORY}) at commit ${currentCommit()}, on ${date}, by tools/setup.mjs.`,
    'To update, copy these files again from a newer Sandkit, keeping their paths.',
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

const [folder, ...requested] = process.argv.slice(2);
if (!folder) fail('Usage: node tools/setup.mjs <sandbox-folder> [component ...]');
setup(folder, requested);
