// Sandkit sb-scenario 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A behaviour scenario as a card: its code, its title, and Given / When / Then steps written
// clearly, each step pointable on its own.
//
//   <sb-scenario></sb-scenario>
//   card.scenario = { code: 'SC-1', title: 'Trip on overload', steps: [{ keyword: 'Given', text: 'a line at 90%', ref: 'SC-1.1' }] };
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-scenario';
  const existing = customElements.get('sb-scenario');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-scenario>, so only one can run. Rename one by replacing every "sb-scenario" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-scenario { display: block; padding: 12px 14px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font-size: 13px; line-height: 1.45; transition: border-color 0.15s, box-shadow 0.15s; }
    .sb-scenario--highlighted { border-color: var(--sb-accent, #2563eb); box-shadow: 0 0 0 3px var(--sb-accent-soft, #eaf0ff); }
    .sb-scenario__head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
    .sb-scenario__code { flex: none; padding: 1px 7px; border-radius: 999px; background: var(--sb-surface-2, #eef0f3); color: var(--sb-muted, #616e7c); font: 600 11px ui-monospace, Menlo, Consolas, monospace; }
    .sb-scenario__title { font-weight: 600; }
    .sb-scenario__steps { display: grid; grid-template-columns: max-content minmax(0, 1fr); column-gap: 10px; margin: 0; padding: 0; list-style: none; }
    .sb-scenario__step { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; padding: 2px 6px; margin: 0 -6px; border-radius: 4px; cursor: pointer; transition: background 0.15s, opacity 0.15s; }
    .sb-scenario__step:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-scenario__step:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    .sb-scenario__step--opens:not(:first-child) { margin-top: 6px; }
    .sb-scenario__keyword { text-align: right; text-transform: uppercase; letter-spacing: 0.06em; font: 700 11px/19px ui-monospace, Menlo, Consolas, monospace; color: var(--sb-accent, #2563eb); }
    .sb-scenario__step--continues .sb-scenario__keyword { color: var(--sb-muted, #616e7c); font-weight: 600; }
    .sb-scenario__value { padding: 0 3px; border-radius: 3px; background: var(--sb-surface-2, #eef0f3); font-variant-numeric: tabular-nums; font-weight: 600; }
    .sb-scenario__step--highlighted { background: var(--sb-accent-soft, #eaf0ff); box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }
    .sb-scenario__step--current { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-scenario__step--current .sb-scenario__text { font-weight: 600; }
    .sb-scenario__step--upcoming { opacity: 0.4; }
    .sb-scenario__empty { color: var(--sb-muted, #616e7c); }`;

  // Steps that carry on the keyword before them: And, But, and Gherkin's bullet.
  const CONTINUES = ['and', 'but', '*'];

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // Quoted text and standalone numbers (not the digits inside a name like 1A23).
  const VALUE = /("[^"]*"|(?<!\w)\d+(?:[.,]\d+)?%?(?!\w))/;

  // Values are what a step is about, so they stand out. Splitting on a capture group puts them at odd indices.
  const markValues = (text) => String(text ?? '').split(VALUE)
    .map((part, i) => (i % 2 ? `<span class="sb-scenario__value">${esc(part)}</span>` : esc(part)))
    .join('');

  function addStyle() {
    if (document.getElementById('sb-scenario-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-scenario-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbScenario extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._scenario = null;
      this._highlight = [];
      this._current = null;
      this.addEventListener('click', (e) => this._select(e.target));
      this.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.sb-scenario__step')) {
          e.preventDefault();
          this._select(e.target);
        }
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-scenario');
      this.render();
    }

    // ---- Public API ----

    // { code, title, steps: [{ keyword, text, ref }] }
    get scenario() { return this._scenario; }
    set scenario(value) {
      this._scenario = value;
      this.render();
    }

    // Refs to light up: the scenario's code lights the card, a step's ref lights its line.
    get highlight() { return this._highlight; }
    set highlight(refs) {
      this._highlight = refs || [];
      this.render();
    }

    // The index of the step happening now; later steps fade. null shows them all plainly.
    get current() { return this._current; }
    set current(index) {
      this._current = index;
      this.render();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      const scenario = this._scenario;
      if (scenario?.code != null) this.dataset.ref = scenario.code;
      else delete this.dataset.ref;
      this.classList.toggle('sb-scenario--highlighted', scenario?.code != null && this._highlight.includes(scenario.code));
      if (!scenario) {
        this.innerHTML = '<div class="sb-scenario__empty">No scenario yet.</div>';
        return;
      }
      this.innerHTML = `
        <div class="sb-scenario__head">
          ${scenario.code != null ? `<span class="sb-scenario__code">${esc(scenario.code)}</span>` : ''}
          <span class="sb-scenario__title">${esc(scenario.title)}</span>
        </div>
        <ol class="sb-scenario__steps">
          ${(scenario.steps || []).map((step, index) => this._step(step, index)).join('')}
        </ol>`;
    }

    _step(step, index) {
      const continues = CONTINUES.includes(String(step.keyword).toLowerCase());
      const classes = [
        'sb-scenario__step',
        continues ? 'sb-scenario__step--continues' : 'sb-scenario__step--opens',
        this._highlight.includes(step.ref) ? 'sb-scenario__step--highlighted' : '',
        this._current === index ? 'sb-scenario__step--current' : '',
        this._current != null && index > this._current ? 'sb-scenario__step--upcoming' : ''
      ].filter(Boolean).join(' ');
      return `
        <li class="${classes}" data-index="${index}" tabindex="0"${step.ref != null ? ` data-ref="${esc(step.ref)}"` : ''}${this._current === index ? ' aria-current="step"' : ''}>
          <span class="sb-scenario__keyword">${esc(step.keyword)}</span>
          <span class="sb-scenario__text">${markValues(step.text)}</span>
        </li>`;
    }

    // ---- Interaction ----

    // Clicking a step only reports it; the sandbox decides what it means, often setting `current`.
    _select(target) {
      const row = target.closest('.sb-scenario__step');
      if (!row) return;
      const index = Number(row.dataset.index);
      const step = this._scenario.steps[index];
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { scenario: this._scenario, step, index } }));
    }
  }

  customElements.define('sb-scenario', SbScenario);
})();
