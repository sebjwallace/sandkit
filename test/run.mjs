#!/usr/bin/env node
// Runs every test.html in the repository in headless Chrome and reports the results.
// No dependencies: just Node and Chrome. Exits with status 1 if anything fails.
//
//   node test/run.mjs
//   CHROME=/path/to/chrome node test/run.mjs     to use a specific browser

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');

// Hidden folders (such as .git) and installed packages never hold Sandkit tests.
const isSkipped = (folder) => folder.startsWith('.') || folder === 'node_modules';

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

function findChrome() {
  const chrome = process.env.CHROME || CHROME_PATHS.find(existsSync);
  if (!chrome) throw new Error('Chrome not found. Set the CHROME environment variable to its path.');
  return chrome;
}

function findTestPages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return isSkipped(entry.name) ? [] : findTestPages(path);
    return entry.name === 'test.html' ? [path] : [];
  });
}

// Each page gets a fresh browser profile, so saved settings never leak between test files.
function runPage(chrome, page) {
  const profile = mkdtempSync(join(tmpdir(), 'sandkit-test-'));
  try {
    const dom = execFileSync(chrome, [
      '--headless=new', '--disable-gpu', '--allow-file-access-from-files', `--user-data-dir=${profile}`,
      '--virtual-time-budget=10000', '--dump-dom', pathToFileURL(page).href
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 });
    const json = dom.match(/<script type="application\/json" id="test-results">([\s\S]*?)<\/script>/)?.[1];
    return json ? JSON.parse(json) : [{ name: 'Test page', passed: false, error: NO_RESULTS }];
  } finally {
    rmSync(profile, { recursive: true, force: true });
  }
}

const NO_RESULTS = 'No results reported (did the page load?)';

// A page that reports nothing means the browser didn't finish, not that a test failed.
// Such a page is retried once; failing tests never are.
function runPageWithRetry(chrome, page) {
  const results = runPage(chrome, page);
  if (results[0]?.error !== NO_RESULTS) return results;
  console.log('  (no results; retrying once)');
  return runPage(chrome, page);
}

const chrome = findChrome();
let passed = 0, failed = 0;

for (const page of findTestPages(ROOT)) {
  console.log(`\n${relative(ROOT, page)}`);
  for (const result of runPageWithRetry(chrome, page)) {
    if (result.passed) passed++; else failed++;
    console.log(`  ${result.passed ? '✓' : '✗'} ${result.name}${result.error ? `\n      ${result.error}` : ''}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
