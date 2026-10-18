#!/usr/bin/env node
// Exports one page of a sandbox as a single HTML file that still runs. No dependencies: just Node.
// Viewers ask for it through the page's Export button (sb-export), which gives them the prompt.
//
//   node tools/export.mjs my-sandbox/pricing.html                    → my-sandbox/export/pricing.html
//   node tools/export.mjs my-sandbox/pricing.html --no-images        images left out
//   node tools/export.mjs my-sandbox/pricing.html --out ~/Desktop/pricing.html
//   node tools/export.mjs my-sandbox --all                           every page, each to its own file
//
// - Puts in what the page points to, and nothing else: scripts, stylesheets (with their url()s)
//   and images, in place and in order. Remote URLs are left as links.
// - Marks the shell as exported, with the date, the sandbox's version (from JOURNAL.md) and
//   Sandkit's, so it can say so and show the other pages as not included.
// - Lists every file it put in, with sizes, so you see exactly what you're sharing, and warns about
//   anything it couldn't include. A missing script stops the export.

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Sandkit's own changelog, one folder up from this tool: in a sandbox's lib/sandkit/, as in Sandkit itself.
const SANDKIT_CHANGELOG = resolve(fileURLToPath(import.meta.url), '../../CHANGELOG.md');

const IMAGES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.avif': 'image/avif'
};
const FONTS = { '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const LARGE = 10 * 1024 * 1024;

const isInline = (ref) => /^(data:|#)/i.test(ref);
const isRemote = (ref) => /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(ref) && !isInline(ref);
const withoutQuery = (ref) => ref.split(/[?#]/)[0];
const typeOf = (ref) => IMAGES[extname(withoutQuery(ref)).toLowerCase()] ?? FONTS[extname(withoutQuery(ref)).toLowerCase()] ?? 'application/octet-stream';

// ---- Building the file ----

// The page as one HTML file, with what went in, what was left out and any warnings.
function bundle(page, { images = true } = {}) {
  const included = [{ path: page, size: statSync(page).size }];
  const leftOut = [];
  const warnings = [];
  const remote = (ref) => warnings.push(`Left as a link, so it needs the internet: ${ref}`);

  // Reads a file the page points to, noting it as included.
  function take(ref, from) {
    const path = resolve(dirname(from), decodeURI(withoutQuery(ref)));
    if (!existsSync(path)) return null;
    if (!included.some((f) => f.path === path)) included.push({ path, size: statSync(path).size });
    return readFileSync(path);
  }

  // What to put in place of an image or font: a data URI, the reference itself when it can't be
  // read, or null when images are left out.
  function dataUri(ref, from) {
    if (isInline(ref)) return ref;
    if (isRemote(ref)) { remote(ref); return ref; }
    const type = typeOf(ref);
    if (!images && type.startsWith('image/')) { leftOut.push(resolve(dirname(from), withoutQuery(ref))); return null; }
    const data = take(ref, from);
    if (!data) { warnings.push(`Not found, so left as it was: ${ref} (in ${basename(from)})`); return ref; }
    return `data:${type};base64,${data.toString('base64')}`;
  }

  // In a stylesheet urls are double-quoted; inside a style="…" attribute, single-quoted.
  const inlineUrls = (css, from, quote = '"') => css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (_, q, ref) => {
    const uri = dataUri(ref, from);
    return uri === null ? 'none' : `url(${quote}${uri}${quote})`;
  });

  // Marked first, before inlined scripts bring their own mentions of <sb-shell> into the page.
  const html = markExported(readFileSync(page, 'utf8'), page)
    .replace(/<script\b([^>]*?)\s+src="([^"]+)"([^>]*)><\/script>/g, (tag, before, ref, after) => {
      if (isRemote(ref)) { remote(ref); return tag; }
      const code = take(ref, page)?.toString();
      if (code == null) throw new Error(`A script the page includes is missing: ${ref}`);
      warnings.push(...scriptWarnings(code, ref));
      return `<script${before}${after}>\n${code.replace(/<\/script/gi, '<\\/script')}\n</script>`;
    })
    .replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, (tag) => {
      const ref = tag.match(/\bhref="([^"]+)"/)?.[1];
      if (!ref) return tag;
      if (isRemote(ref)) { remote(ref); return tag; }
      const css = take(ref, page)?.toString();
      if (css == null) { warnings.push(`Not found, so left as it was: ${ref}`); return tag; }
      return `<style>\n${inlineUrls(css, resolve(dirname(page), ref))}\n</style>`;
    })
    .replace(/(<(?:img|source)\b[^>]*?)\s+src="([^"]+)"/g, (tag, start, ref) => {
      const uri = dataUri(ref, page);
      return uri === null ? start : `${start} src="${uri}"`;
    })
    .replace(/\bsrcset="([^"]+)"/g, (_, set) => {
      const candidates = set.split(',').map((candidate) => {
        const [ref, ...size] = candidate.trim().split(/\s+/);
        const uri = dataUri(ref, page);
        return uri === null ? null : [uri, ...size].join(' ');
      });
      return `srcset="${candidates.filter(Boolean).join(', ')}"`;
    })
    .replace(/\bstyle="([^"]*url\([^"]*)"/g, (_, style) => `style="${inlineUrls(style, page, "'")}"`);

  return { html, included, leftOut: [...new Set(leftOut)], warnings: [...new Set(warnings)] };
}

// Things in the sandbox's scripts the export can't follow: files named in strings, and fetching.
// Sandkit's own scripts are safe to export, so aren't checked; pages named in code are links, not files.
function scriptWarnings(code, ref) {
  if (code.startsWith('// Sandkit ')) return [];
  const paths = code.match(/(['"`])(?![a-z]+:|\/\/)[\w./-]+\.(png|jpe?g|gif|webp|svg|avif|mp3|mp4|webm|json|csv|txt)\1/gi) ?? [];
  const warnings = [...new Set(paths)].map((path) => `${ref} names a file in its code, which isn't included: ${path}`);
  if (/\bfetch\s*\(|XMLHttpRequest/.test(code)) warnings.push(`${ref} fetches files, which won't work in the export.`);
  return warnings;
}

// The shell says it's an export: when, from which versions of the sandbox and Sandkit, and which page.
function markExported(html, page) {
  const version = latestVersion(join(dirname(page), 'JOURNAL.md'));
  const sandkit = latestVersion(SANDKIT_CHANGELOG);
  const attributes = [`exported="${new Date().toISOString().slice(0, 10)}"`, version && `version="${version}"`, sandkit && `sandkit="${sandkit}"`, `page="${basename(page)}"`];
  return html.replace(/<sb-shell\b/, `<sb-shell ${attributes.filter(Boolean).join(' ')}`);
}

// The newest version heading in a journal or changelog ("## 0.4.0 · 2026-10-18").
function latestVersion(file) {
  if (!existsSync(file)) return null;
  return readFileSync(file, 'utf8').match(/^## (\d+\.\d+\.\d+)/m)?.[1] ?? null;
}

// ---- Reporting ----

const shortPath = (path) => relative(process.cwd(), path) || path;

const formatSize = (bytes) => (bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

function report(page, out, { html, included, leftOut, warnings }) {
  const size = Buffer.byteLength(html);
  const total = included.reduce((sum, f) => sum + f.size, 0);
  if (size > LARGE) warnings.push(`The exported file is ${formatSize(size)}, which may be too big to send.`);
  console.log(`\nExported ${shortPath(page)} → ${shortPath(out)} (${formatSize(size)})\n\nIncluded:`);
  for (const file of included) console.log(`  ${formatSize(file.size).padStart(9)}  ${shortPath(file.path)}`);
  console.log(`  ${formatSize(total).padStart(9)}  total, ${included.length} files`);
  if (leftOut.length) console.log(`\nLeft out, as asked:\n${leftOut.map((path) => `  ${shortPath(path)}`).join('\n')}`);
  if (warnings.length) console.log(`\nWarnings:\n${warnings.map((w) => `  ! ${w}`).join('\n')}`);
}

// ---- Command line ----

function exportPage(page, out, options) {
  if (!existsSync(page)) throw new Error(`There's no page at ${page}.`);
  const result = bundle(resolve(page), options);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, result.html);
  report(resolve(page), out, result);
}

function main(args) {
  const outAt = args.indexOf('--out');
  const out = outAt >= 0 ? resolve(args[outAt + 1]) : null;
  const target = args.find((arg, i) => !arg.startsWith('--') && !(outAt >= 0 && i === outAt + 1));
  if (!target) throw new Error('Usage: node tools/export.mjs <page.html> [--no-images] [--out <file>], or <sandbox-folder> --all');

  const options = { images: !args.includes('--no-images') };
  const pages = args.includes('--all')
    ? readdirSync(target).filter((name) => name.endsWith('.html')).map((name) => join(target, name))
    : [target];
  for (const page of pages) {
    exportPage(page, out && pages.length === 1 ? out : join(dirname(resolve(page)), 'export', basename(page)), options);
  }
}

try {
  main(process.argv.slice(2));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
