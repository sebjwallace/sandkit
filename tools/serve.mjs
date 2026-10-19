#!/usr/bin/env node
// Serves a sandbox folder on this computer, so its pages can read and write the sandbox's own files.
// No dependencies: just Node.
//
//   node tools/serve.mjs path/to/sandbox                → http://127.0.0.1:8080
//   node tools/serve.mjs path/to/sandbox --port 9000
//
// - Serves the folder's files, on 127.0.0.1 only, so nothing else on the network can reach it.
//   Paths outside the folder are refused. If the port is taken, the next few are tried.
// - GET /_sandkit/files?dir=sources lists the files under a folder of the sandbox: [{ path, size, modified }].
// - POST /_sandkit/inbox with { name, content } writes sources/inbox/<name>, never overwriting
//   (a taken name becomes name-2, name-3…), and answers { path }. Bodies over 5 MB are refused.
//
// Sandboxes still open by double-clicking; only the features that need files ask for this.

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, relative, resolve, sep } from 'node:path';

const HOST = '127.0.0.1';
const PORTS_TO_TRY = 10;
const MAX_BODY = 5 * 1024 * 1024;
const INBOX = 'sources/inbox';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.md': 'text/markdown', '.txt': 'text/plain', '.csv': 'text/csv',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf', '.ico': 'image/x-icon'
};
const typeOf = (file) => {
  const type = TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
  return type.startsWith('text/') || type === 'application/json' ? `${type}; charset=utf-8` : type;
};

// The file a request names, or null when it would leave the sandbox.
function inside(root, path) {
  const file = resolve(root, `.${path}`);
  return file === root || file.startsWith(root + sep) ? file : null;
}

function serveFile(root, url, res) {
  let file = inside(root, decodeURIComponent(url.pathname));
  if (!file) return send(res, 403, 'Outside the sandbox.');
  if (existsSync(file) && statSync(file).isDirectory()) {
    // A folder's own address ends in a slash, so its page's relative links resolve inside it.
    if (!url.pathname.endsWith('/')) return redirect(res, `${url.pathname}/`);
    file = join(file, 'index.html');
  }
  if (!existsSync(file)) return send(res, 404, 'Not found.');
  res.writeHead(200, { 'Content-Type': typeOf(file) });
  res.end(readFileSync(file));
}

function listFiles(root, url, res) {
  const dir = inside(root, `/${url.searchParams.get('dir') ?? ''}`);
  if (!dir) return send(res, 403, 'Outside the sandbox.');
  const files = existsSync(dir) ? filesUnder(dir) : [];
  sendJson(res, files.map((file) => {
    const stats = statSync(file);
    return { path: relative(root, file).split(sep).join('/'), size: stats.size, modified: stats.mtime.toISOString() };
  }));
}

const filesUnder = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? filesUnder(path) : [path];
});

async function writeToInbox(root, req, res) {
  const body = await readBody(req);
  if (body === null) return send(res, 413, 'Too large: the limit is 5 MB.');
  let name, content;
  try {
    ({ name, content } = JSON.parse(body));
  } catch {
    return send(res, 400, 'Send JSON: { "name": "...", "content": "..." }.');
  }
  if (typeof name !== 'string' || typeof content !== 'string') return send(res, 400, 'Both name and content must be text.');
  const inbox = join(root, INBOX);
  mkdirSync(inbox, { recursive: true });
  const file = freeName(inbox, safeName(name));
  writeFileSync(join(inbox, file), content);
  sendJson(res, { path: `${INBOX}/${file}` });
}

// The body as text, or null once it passes the limit.
function readBody(req) {
  return new Promise((done, failed) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) { req.destroy(); done(null); } else chunks.push(chunk);
    });
    req.on('end', () => done(Buffer.concat(chunks).toString('utf8')));
    req.on('error', failed);
  });
}

// Letters, digits, dots, dashes and underscores only, and never a hidden file.
const safeName = (name) => name.split(/[/\\]/).pop().replace(/[^\w.-]+/g, '-').replace(/^[.-]+/, '') || 'untitled';

function freeName(dir, name) {
  const ext = extname(name);
  const stem = name.slice(0, name.length - ext.length);
  let candidate = name;
  for (let n = 2; existsSync(join(dir, candidate)); n++) candidate = `${stem}-${n}${ext}`;
  return candidate;
}

function send(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

function redirect(res, location) {
  res.writeHead(301, { Location: location });
  res.end();
}

function sendJson(res, value) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

function handle(root) {
  return (req, res) => {
    const url = new URL(req.url, `http://${HOST}`);
    if (req.method === 'GET' && url.pathname === '/_sandkit/files') return listFiles(root, url, res);
    if (req.method === 'POST' && url.pathname === '/_sandkit/inbox') return writeToInbox(root, req, res).catch(() => send(res, 500, 'Could not write.'));
    if (req.method === 'GET') return serveFile(root, url, res);
    send(res, 405, 'Not allowed.');
  };
}

// Tries each port in turn from the one asked for, saying which it got.
function listen(server, folder, port, triesLeft) {
  server.once('error', (err) => {
    if (err.code !== 'EADDRINUSE' || triesLeft <= 1) fail(`Could not serve on port ${port}: ${err.message}`);
    listen(server, folder, port + 1, triesLeft - 1);
  });
  server.listen(port, HOST);
}

function serve(folder, port) {
  const root = resolve(folder);
  if (!existsSync(root) || !statSync(root).isDirectory()) fail(`There's no folder at ${folder}.`);
  const server = createServer(handle(root));
  server.once('listening', () => console.log(`Serving ${folder} at http://${HOST}:${server.address().port}`));
  listen(server, folder, port, PORTS_TO_TRY);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const portAt = args.indexOf('--port');
const port = portAt >= 0 ? Number(args.splice(portAt, 2)[1]) : 8080;
const [folder] = args;
if (!folder || !Number.isInteger(port)) fail('Usage: node tools/serve.mjs <sandbox-folder> [--port <number>]');
serve(folder, port);
