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
// - The one exception to never overwriting: Sandkit's own guidance in the sandbox's AGENTS.md is kept current, between
//   <!-- sandkit:components --> and <!-- sandkit:mechanisms --> markers, with the catalog's Find by need index inside the first.
//   Only what's between them is replaced. An older sandbox without them has those sections found by their headings and replaced,
//   or added in the template's position, with the old text saved to lib/sandkit/AGENTS-replaced.md first. Nothing else changes.
// - Copies the shell, the catalog, the style guide, the practices, the page template, the export, serve, sources and tags tools, sb-comments
//   (the template's comment mode), the tags engine (the tags tool runs on it), and each named component, engine or mechanism (plus any the sandbox already has) into lib/sandkit/,
//   keeping Sandkit's paths, with their manifests and changelogs.
// - Adds a script tag to index.html, or the page named, for each component or engine named that doesn't have one yet,
//   after the last Sandkit script.
// - A mechanism belongs to the model, not to a page, so --page doesn't apply to it. Every installed mechanism gets a tag just before
//   model.js's on every page in the sandbox's folder that loads model.js, on every run, so a page added later is caught by the next.
// - Writes lib/sandkit/SOURCE.md, recording every version and file in a fixed order, so updates give small diffs.
// - When updating, reports what changed since the installed versions of Sandkit and each part, breaking changes first,
//   and says so plainly when nothing did.
// - A retired component a sandbox still has is left as it is, with a note of what replaces it.
//
// Running it again refreshes every copy, so setting up, adding and updating are the same command.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SANDKIT = resolve(fileURLToPath(import.meta.url), '../..');
const REPOSITORY = 'https://github.com/sebjwallace/sandkit';
const EVERY_SANDBOX = ['sb-comments']; // components the template uses
const EVERY_SANDBOX_ENGINES = ['tags']; // engines Sandkit's own tools need: tools/tags.mjs runs on the tags engine
// Components Sandkit no longer has, and what replaces each. See CHANGELOG.md for how to move.
const RETIRED = { 'sb-discovery-board': 'sb-lineage', 'sb-source-trace': 'sb-lineage' };
const SANDKIT_FILES = ['CATALOG.md', 'CHANGELOG.md', 'STYLE.md', 'templates/page.html', 'tools/export.mjs', 'tools/serve.mjs', 'tools/sources.mjs', 'tools/tags.mjs'];
const SHELL_FILES = ['shell/CHANGELOG.md', 'shell/manifest.md', 'shell/sb-export.js', 'shell/sb-highlighting.js', 'shell/sb-shell.js', 'shell/sb-theme-settings.js'];

function setup(folder, requested, page = 'index.html') {
  const sandbox = resolve(folder);
  const lib = join(sandbox, 'lib', 'sandkit');
  requested.forEach(checkAvailable);

  const isNew = !existsSync(join(sandbox, 'index.html'));
  if (isNew) cpSync(join(SANDKIT, 'templates', 'sandbox'), sandbox, { recursive: true, force: false });
  addAgentPointer(sandbox);
  if (!existsSync(join(sandbox, page))) fail(`${folder} has no page called ${page}. Start one from lib/sandkit/templates/page.html.`);
  const sandkit = { name: 'Sandkit', changelog: 'CHANGELOG.md', from: installedSandkitVersion(lib), to: sandkitVersion() };
  const guidance = refreshGuidance(join(sandbox, 'AGENTS.md'), lib, sandkit);

  const kept = installedIn(lib, 'components').filter((name) => RETIRED[name]);
  const components = [...new Set([...EVERY_SANDBOX, ...installedIn(lib, 'components'), ...requested.filter((name) => kindOf(name) === 'components')])]
    .filter((name) => !RETIRED[name]).sort();
  const engines = [...new Set([...EVERY_SANDBOX_ENGINES, ...installedIn(lib, 'engines'), ...requested.filter(isEngine)])].sort();
  const mechanisms = [...new Set([...installedIn(lib, 'mechanisms'), ...requested.filter(isMechanism)])].sort();
  const packages = ['shell', ...components, ...engines, ...mechanisms].map(packageOf);
  const installed = Object.fromEntries(packages.map((p) => [p.name, versionIn(join(lib, p.script))]));

  const files = [...[...SANDKIT_FILES, ...practices()].sort(), ...SHELL_FILES, ...[...components, ...engines, ...mechanisms].flatMap(filesOf)];
  for (const file of files) {
    mkdirSync(dirname(join(lib, file)), { recursive: true });
    cpSync(join(SANDKIT, file), join(lib, file));
  }
  const tagged = addScriptTags(join(sandbox, page), requested.filter((name) => !isMechanism(name)));
  const mechanismTags = addMechanismTags(sandbox, mechanisms);
  const versions = packages.map((p) => ({ ...p, from: installed[p.name], to: versionIn(join(SANDKIT, p.script)) }));
  writeFileSync(join(lib, 'SOURCE.md'), sourceRecord(files, versions));

  console.log(`${isNew ? 'Created' : 'Updated'} ${basename(sandbox)}${isNew ? ' from the template' : ''}.`);
  const parts = [...components, ...engines.map((name) => `the ${name} engine`), ...mechanisms.map((name) => `the ${name} mechanism`)];
  console.log(`Copied ${files.length} files into lib/sandkit/${parts.length ? `, with ${parts.join(', ')}` : ''}.`);
  if (guidance.changed && !isNew) console.log('Refreshed Sandkit\'s sections in AGENTS.md.');
  if (guidance.saved) console.log('Saved the text those sections replaced to lib/sandkit/AGENTS-replaced.md: put back any lines the sandbox had added, outside the markers.');
  if (tagged.added.length) console.log(`Added script tags for ${tagged.added.join(', ')} to ${page}.`);
  if (tagged.missing.length) console.log(`Add script tags for ${tagged.missing.join(', ')} to ${page} yourself: no Sandkit script tag was found to place them after.`);
  for (const [name, pages] of Object.entries(mechanismTags.added)) console.log(`Added script tags for ${name} to ${pages.join(', ')}.`);
  if (mechanismTags.missing.length) console.log(`Add script tags for ${mechanismTags.missing.join(', ')} yourself, just before model.js's: no page loads model.js yet.`);
  if (!isNew) reportChanges(sandkit, versions.filter((v) => v.from && v.from !== v.to));
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

// ---- Sandkit's guidance in AGENTS.md ----
// The sections Sandkit owns are copied from the template's AGENTS.md, between markers, so they stay current in front of
// the agent. Everything outside the markers is the sandbox's own.

const GUIDANCE = [
  { name: 'components', heading: '## Sandkit components' },
  { name: 'mechanisms', heading: '## Sandkit mechanisms' }
];
const REPLACED_FILE = 'AGENTS-replaced.md';

const startMarker = (name) => `<!-- sandkit:${name} -->`;
const endMarker = (name) => `<!-- /sandkit:${name} -->`;
const replaceRange = (text, { start, end }, replacement) => text.slice(0, start) + replacement + text.slice(end);

function blockIn(text, name) {
  const start = text.indexOf(startMarker(name));
  const end = text.indexOf(endMarker(name), start);
  return start >= 0 && end > start ? { start, end: end + endMarker(name).length } : null;
}

// The body of the catalog's Find by need section, without its heading.
function findByNeed() {
  const catalog = readFileSync(join(SANDKIT, 'CATALOG.md'), 'utf8');
  return catalog.match(/^## Find by need\n+([\s\S]*?)\n+^## /m)[1];
}

// A section as it should be in a sandbox: the template's, with the index filled in.
function currentBlock(template, name) {
  const block = template.slice(blockIn(template, name).start, blockIn(template, name).end);
  const index = blockIn(block, 'find-by-need');
  return index ? replaceRange(block, index, `${startMarker('find-by-need')}\n${findByNeed()}\n${endMarker('find-by-need')}`) : block;
}

// Where a line starts in the text, or -1.
const lineAt = (text, line) => `\n${text}\n`.indexOf(`\n${line}\n`);

// A section runs from its heading to the next heading of its level, leaving the blank lines before that one.
function sectionIn(text, heading) {
  const start = lineAt(text, heading);
  if (start < 0) return null;
  const next = text.indexOf('\n## ', start + 1);
  return { start, end: start + (next < 0 ? text.slice(start) : text.slice(start, next)).trimEnd().length };
}

// Adds a section before whatever follows it in the template, or else at the end.
function withBlockInserted(text, template, name, block) {
  const following = template.slice(blockIn(template, name).end).split('\n').filter((line) => /^(## |<!-- sandkit:)/.test(line));
  const at = following.map((line) => lineAt(text, line)).find((position) => position >= 0);
  if (at !== undefined) return `${text.slice(0, at)}${block}\n\n${text.slice(at)}`;
  return `${text}${text.endsWith('\n') ? '\n' : '\n\n'}${block}\n`;
}

// An older sandbox's index needs no copy: it was never the sandbox's to edit, and each run has always replaced it.
function withoutIndex(text) {
  const index = blockIn(text, 'find-by-need');
  return index ? text.slice(0, index.start).replace(/\n+$/, '') + text.slice(index.end) : text;
}

// Returns the text with every section current, and the old text of any section that had no markers yet.
function withCurrentGuidance(text, template) {
  let updated = blockIn(text, 'components') ? text : withoutIndex(text);
  const replaced = [];
  for (const { name, heading } of GUIDANCE) {
    const block = currentBlock(template, name);
    const marked = blockIn(updated, name);
    const section = marked ? null : sectionIn(updated, heading);
    if (section) replaced.push(updated.slice(section.start, section.end));
    if (marked || section) updated = replaceRange(updated, marked ?? section, block);
    else updated = withBlockInserted(updated, template, name, block);
  }
  return { updated, replaced };
}

// Adds to the file, rather than overwriting, so an earlier copy is never lost. Each addition says which update made it.
function saveReplaced(lib, sections, { from, to }) {
  const file = join(lib, REPLACED_FILE);
  const earlier = existsSync(file) ? readFileSync(file, 'utf8') : '# Replaced in AGENTS.md\n\nText that Sandkit\'s setup replaced when it began keeping its own sections current. Sandkit\'s text here is out of date; put back any lines the sandbox added, outside the markers.\n';
  mkdirSync(lib, { recursive: true });
  const update = from && from !== to ? `${from} → ${to}` : to;
  writeFileSync(file, `${earlier}\n## ${new Date().toISOString().slice(0, 10)}, Sandkit ${update}\n\n${sections.join('\n\n')}\n`);
}

function refreshGuidance(agentsPath, lib, sandkit) {
  if (!existsSync(agentsPath)) return { changed: false, saved: false };
  const text = readFileSync(agentsPath, 'utf8');
  const { updated, replaced } = withCurrentGuidance(text, readFileSync(join(SANDKIT, 'templates', 'sandbox', 'AGENTS.md'), 'utf8'));
  if (replaced.length) saveReplaced(lib, replaced, sandkit);
  if (updated !== text) writeFileSync(agentsPath, updated);
  return { changed: updated !== text, saved: replaced.length > 0 };
}

// ---- Script tags ----

// Matches script tags that stand on their own line, so commented-out examples don't count.
const SANDKIT_TAG = /^([ \t]*)<script src="(lib\/sandkit\/[^"]+)"><\/script>$/gm;

const MODEL_TAG = /^([ \t]*)<script src="model\.js"><\/script>$/m;

const hasScriptTag = (html, src) => [...html.matchAll(SANDKIT_TAG)].some((tag) => tag[2] === src);

// Tags go after the last Sandkit script tag, so they load after the shell.
function addScriptTags(pagePath, parts) {
  let html = readFileSync(pagePath, 'utf8');
  const added = [], missing = [];
  for (const name of parts) {
    const src = `lib/sandkit/${scriptOf(name)}`;
    if (hasScriptTag(html, src)) continue;
    const lastTag = [...html.matchAll(SANDKIT_TAG)].at(-1);
    if (!lastTag) { missing.push(name); continue; }
    const end = lastTag.index + lastTag[0].length;
    html = `${html.slice(0, end)}\n${lastTag[1]}<script src="${src}"></script>${html.slice(end)}`;
    added.push(name);
  }
  writeFileSync(pagePath, html);
  return { added, missing };
}

// Tags go just before model.js's, on every page that loads the model, since the model needs them when it loads.
// Returns the pages tagged for each mechanism, and the mechanisms left untagged because no page loads the model.
function addMechanismTags(sandbox, mechanisms) {
  const pages = readdirSync(sandbox).filter((file) => file.endsWith('.html')).sort();
  const modelPages = pages.filter((page) => MODEL_TAG.test(readFileSync(join(sandbox, page), 'utf8')));
  const added = {};
  for (const page of modelPages) {
    let html = readFileSync(join(sandbox, page), 'utf8');
    for (const name of mechanisms) {
      const src = `lib/sandkit/${scriptOf(name)}`;
      if (hasScriptTag(html, src)) continue;
      const model = html.match(MODEL_TAG);
      html = `${html.slice(0, model.index)}${model[1]}<script src="${src}"></script>\n${html.slice(model.index)}`;
      (added[name] ??= []).push(page);
    }
    writeFileSync(join(sandbox, page), html);
  }
  return { added, missing: modelPages.length ? [] : mechanisms };
}

// ---- Versions ----
// A component's, engine's or mechanism's version is the top entry of its changelog, repeated in its script's first line
// ("// Sandkit sb-log 0.1.0 · …"), so a copied script always says what it is. The shell's
// scripts share one version.

const packageOf = (name) => (name === 'shell'
  ? { name: 'shell', script: 'shell/sb-shell.js', changelog: 'shell/CHANGELOG.md' }
  : { name, script: scriptOf(name), changelog: scriptOf(name).replace(/[^/]+\.js$/, 'CHANGELOG.md') });

function versionIn(scriptPath) {
  if (!existsSync(scriptPath)) return null;
  return readFileSync(scriptPath, 'utf8').match(/^\/\/ Sandkit \S+ (\d+\.\d+\.\d+) /)?.[1] ?? null;
}

// [{ version, notes }] from a changelog's "## 1.2.3 · date" headings and the "- " lines under them, each with its indented points.
function releases(changelogPath) {
  const result = [];
  for (const line of readFileSync(changelogPath, 'utf8').split('\n')) {
    const heading = line.match(/^## (\d+\.\d+\.\d+)/);
    if (heading) result.push({ version: heading[1], notes: [] });
    else if (line.startsWith('- ') && result.length) result.at(-1).notes.push(line.slice(2));
    else if (line.startsWith('  - ') && result.at(-1)?.notes.length) result.at(-1).notes.push(`${result.at(-1).notes.pop()}\n    ${line.trim()}`);
  }
  return result;
}

function compareVersions(a, b) {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

// Lists what changed since each installed version, breaking changes first, so whoever updates
// the sandbox knows what to migrate.
function reportChanges(sandkit, updatedParts) {
  const sandkitChanged = sandkit.from && sandkit.from !== sandkit.to;
  let anyBreaking = false;
  for (const { name, changelog, from, to } of [...(sandkitChanged ? [sandkit] : []), ...updatedParts]) {
    const notes = releases(join(SANDKIT, changelog))
      .filter((r) => compareVersions(r.version, from) > 0 && compareVersions(r.version, to) <= 0)
      .flatMap((r) => r.notes.map((note) => `${r.version}: ${note}`));
    const isBreaking = (note) => note.includes('**Breaking');
    anyBreaking ||= notes.some(isBreaking);
    console.log(`\n${name} ${from} → ${to}`);
    for (const note of [...notes.filter(isBreaking), ...notes.filter((n) => !isBreaking(n))]) console.log(`  - ${note}`);
  }
  if (anyBreaking) console.log('\nBreaking changes are listed first. Each says how to migrate: apply them before using the sandbox.');
  if (updatedParts.length) return;
  if (sandkit.from === sandkit.to) console.log(`Sandkit hasn't changed: still ${sandkit.to}, with every part at the same version.`);
  else console.log(`${sandkitChanged ? '\n' : ''}No component, engine or mechanism changed version.`);
}

const sandkitVersion = () => releases(join(SANDKIT, 'CHANGELOG.md'))[0]?.version ?? 'unknown';

function installedSandkitVersion(lib) {
  const source = join(lib, 'SOURCE.md');
  if (!existsSync(source)) return null;
  return readFileSync(source, 'utf8').match(/^Copied from Sandkit (\d+\.\d+\.\d+)/m)?.[1] ?? null;
}

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
