// Sandkit test harness · MIT Licence · https://github.com/sebjwallace/sandkit
// A minimal test runner for test.html pages. No dependencies.
//
//   test('renders newest first', async () => {
//     const log = mount('<sb-log></sb-log>');
//     log.entries = [{ text: 'a' }, { text: 'b' }];
//     assertEqual(log.querySelector('li').textContent.trim(), 'b');
//   });
//
// Tests run in order once the page has loaded. Results are shown on the page and also written
// as JSON into <script id="test-results">, where test/run.mjs reads them.
(function () {
  const tests = [];
  const pageErrors = [];
  window.addEventListener('error', (e) => pageErrors.push(e.message));
  window.addEventListener('unhandledrejection', (e) => pageErrors.push(String(e.reason)));

  function test(name, fn) {
    tests.push({ name, fn });
  }

  function assert(condition, message = 'Expected a truthy value') {
    if (!condition) throw new Error(message);
  }

  // Compares primitives with Object.is, and arrays or objects by their JSON form.
  function assertEqual(actual, expected, message) {
    const same = Object.is(actual, expected) || JSON.stringify(actual) === JSON.stringify(expected);
    if (!same) throw new Error(`${message ? message + ': ' : ''}expected ${format(expected)}, got ${format(actual)}`);
  }

  function assertThrows(fn, message = 'Expected an error to be thrown') {
    try { fn(); } catch { return; }
    throw new Error(message);
  }

  const format = (value) => (typeof value === 'string' ? `"${value}"` : JSON.stringify(value));

  // Puts markup, or an element, into a fresh fixture area and returns the element.
  // The fixture is cleared after each test.
  function mount(content) {
    if (typeof content === 'string') fixture().innerHTML = content;
    else fixture().replaceChildren(content);
    return fixture().firstElementChild;
  }

  function fixture() {
    let area = document.getElementById('test-fixture');
    if (!area) {
      area = Object.assign(document.createElement('div'), { id: 'test-fixture' });
      document.body.append(area);
    }
    return area;
  }

  // Resolves after the browser has had a chance to lay out and fire observers.
  // Headless browsers occasionally skip a frame, so it also resolves after a short wait.
  const FRAME_FALLBACK_MS = 100;
  const nextFrame = () => new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve));
    setTimeout(resolve, FRAME_FALLBACK_MS);
  });

  // A test that never finishes fails on its own, rather than silencing every test after it.
  const TEST_TIMEOUT_MS = 3000;
  const timeout = () => new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${TEST_TIMEOUT_MS} ms`)), TEST_TIMEOUT_MS));

  // Collects the events of one type that bubble up to `target`.
  function recordEvents(target, type) {
    const events = [];
    target.addEventListener(type, (e) => events.push(e));
    return events;
  }

  async function runAll() {
    const results = [];
    for (const { name, fn } of tests) {
      try {
        await Promise.race([fn(), timeout()]);
        results.push({ name, passed: true });
      } catch (err) {
        results.push({ name, passed: false, error: err.message });
      }
      fixture().innerHTML = '';
    }
    for (const message of pageErrors) results.push({ name: 'Page error', passed: false, error: message });
    report(results);
  }

  function report(results) {
    const failed = results.filter((r) => !r.passed).length;
    const output = document.createElement('section');
    output.id = 'test-report';
    output.innerHTML = `
      <h1>${document.title}: ${failed ? `${failed} failed` : 'all passed'} (${results.length} tests)</h1>
      <ul>${results.map((r) => `<li style="color: ${r.passed ? 'green' : 'crimson'}">
        ${r.passed ? '✓' : '✗'} ${escapeHtml(r.name)}${r.error ? ` — ${escapeHtml(r.error)}` : ''}</li>`).join('')}
      </ul>`;
    document.body.prepend(output);

    const data = Object.assign(document.createElement('script'), { type: 'application/json', id: 'test-results' });
    data.textContent = JSON.stringify(results);
    document.body.append(data);
  }

  const escapeHtml = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  Object.assign(window, { test, assert, assertEqual, assertThrows, mount, nextFrame, recordEvents });
  window.addEventListener('load', runAll);
})();
