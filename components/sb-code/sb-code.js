// Sandkit sb-code 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// Code, or pseudocode, walked through a step at a time: the line running now is marked, and the
// variables beside it show what changed. The steps are a trace that the sandbox's model records
// as it runs, so the model stays the source of truth.
//
//   <sb-code controls></sb-code>
//   code.code = 'total = 0\nfor n in numbers\n  total = total + n';
//   code.trace = [{ line: 1, variables: { total: 0 } }, { line: 2, variables: { total: 0, n: 4 } }];
//   code.step = 1;
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-code';
  const existing = customElements.get('sb-code');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-code>, so only one can run. Rename one by replacing every "sb-code" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-code { display: block; font-size: 13px; }
    .sb-code__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 8px; }
    .sb-code__bar[hidden] { display: none; }
    .sb-code__button { min-width: 30px; padding: 3px 8px; font: inherit; color: var(--sb-text, #1f2933); background: var(--sb-surface-2, #eef0f3); border: 0; border-radius: var(--sb-radius, 8px); cursor: pointer; }
    .sb-code__button:disabled { opacity: 0.4; cursor: default; }
    .sb-code__button:focus-visible, .sb-code__slider:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-code__slider { flex: 1 1 120px; min-width: 80px; accent-color: var(--sb-accent, #2563eb); }
    .sb-code__count { color: var(--sb-muted, #616e7c); font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .sb-code__note { min-height: 1.5em; margin-bottom: 8px; color: var(--sb-text, #1f2933); }
    .sb-code__note[hidden] { display: none; }
    .sb-code__body { display: flex; gap: 12px; align-items: flex-start; }
    .sb-code__code { flex: 3 1 300px; min-width: 0; max-height: var(--sb-code-height, none); overflow: auto; margin: 0; padding: 6px 0; border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); font: 12.5px/1.6 ui-monospace, Menlo, Consolas, monospace; }
    .sb-code__line { display: flex; padding-right: 12px; }
    .sb-code__number { flex: none; width: 3.5em; padding-right: 1em; text-align: right; color: var(--sb-muted, #616e7c); user-select: none; cursor: pointer; }
    .sb-code__text { flex: 1; white-space: pre; }
    .sb-code__line--current { background: var(--sb-accent-soft, #eaf0ff); box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }
    .sb-code__line--current .sb-code__number { color: var(--sb-accent, #2563eb); font-weight: 700; }
    .sb-code__line--highlighted { box-shadow: inset 0 0 0 1.5px var(--sb-accent, #2563eb); }
    .sb-code__comment { color: var(--sb-muted, #616e7c); font-style: italic; }
    .sb-code__string { color: var(--sb-good, #3f9142); }
    .sb-code__number-literal, .sb-code__literal { color: var(--sb-warn, #b7791f); }
    .sb-code__keyword { color: var(--sb-accent, #2563eb); font-weight: 600; }
    .sb-code__name--variable { cursor: pointer; }
    .sb-code__name--highlighted { border-radius: 3px; background: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #fff); }
    .sb-code__pane { flex: 1 1 180px; }
    .sb-code__pane:not([open]) { flex: none; }
    .sb-code__toggle { padding-bottom: 4px; color: var(--sb-muted, #616e7c); font: 600 11px var(--sb-font, system-ui); text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; }
    .sb-code__toggle:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-code__variables { width: 100%; margin: 0; border-collapse: collapse; font: 12.5px ui-monospace, Menlo, Consolas, monospace; }
    .sb-code__variables th, .sb-code__variables td { padding: 3px 8px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--sb-surface-2, #eef0f3); }
    .sb-code__variable { cursor: pointer; }
    .sb-code__variable:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    .sb-code__variables th { font-weight: 600; white-space: nowrap; }
    .sb-code__variables td { width: 100%; max-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sb-code__variable--open td { white-space: normal; overflow-wrap: anywhere; }
    .sb-code__variable--changed td { background: color-mix(in srgb, var(--sb-warn, #d69e2e) 20%, transparent); }
    .sb-code__variable--highlighted th { color: var(--sb-accent, #2563eb); }
    .sb-code__variable--highlighted { box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }
    .sb-code__empty { color: var(--sb-muted, #616e7c); font-family: var(--sb-font, system-ui); }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  function addStyle() {
    if (document.getElementById('sb-code-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-code-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Elements with an id remember whether each viewer opened or closed the variables.
  const storage = {
    read(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* kept for this visit only */ }
    }
  };

  // ---- Showing code ----

  // Words common to pseudocode, JavaScript and Python. Sandboxes extend them for their own
  // languages. Words match whatever their case.
  const DEFAULT_SYNTAX = {
    keywords: ['if', 'then', 'else', 'elif', 'for', 'each', 'in', 'of', 'to', 'while', 'do', 'repeat', 'until', 'loop', 'break',
      'continue', 'return', 'function', 'procedure', 'def', 'let', 'const', 'var', 'and', 'or', 'not', 'is', 'begin', 'end',
      'class', 'switch', 'case', 'default', 'try', 'catch', 'throw', 'async', 'await'],
    literals: ['true', 'false', 'null', 'none', 'nil', 'undefined'],
    comments: ['//', '#']
  };

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Light colouring from a syntax: comments, strings, numbers, keywords, literals, and the other
  // names (which can be pointed at as variables).
  function colourer(syntax) {
    const comments = syntax.comments.map(escapeRegExp).join('|') || '(?!)';
    const tokens = new RegExp(`((?:${comments}).*)|("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`[^\`]*\`)|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_$][\\w$]*)`, 'g');
    const keywords = new Set(syntax.keywords.map((w) => w.toLowerCase()));
    const literals = new Set(syntax.literals.map((w) => w.toLowerCase()));
    const span = (kind, text) => `<span class="sb-code__${kind}">${esc(text)}</span>`;
    return (line) => {
      let html = '', last = 0;
      for (const match of line.matchAll(tokens)) {
        const [text, comment, string, number, name] = match;
        html += esc(line.slice(last, match.index));
        if (comment) html += span('comment', text);
        else if (string) html += span('string', text);
        else if (number) html += span('number-literal', text);
        else if (keywords.has(name.toLowerCase())) html += span('keyword', text);
        else if (literals.has(name.toLowerCase())) html += span('literal', text);
        else html += `<span class="sb-code__name" data-name="${esc(text)}">${esc(text)}</span>`;
        last = match.index + text.length;
      }
      return html + esc(line.slice(last));
    };
  }

  // Values as people write them: [3, 1, 2], { name: "Ada" }, "text", null.
  function show(value) {
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(show).join(', ')}]`;
    if (value && typeof value === 'object') return `{ ${Object.entries(value).map(([k, v]) => `${k}: ${show(v)}`).join(', ')} }`;
    return String(value);
  }

  class SbCode extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['controls', 'empty-text', 'variables'];

    constructor() {
      super();
      this._code = '';
      this._trace = [];
      this._step = 0;
      this._highlight = {};
      this._syntax = DEFAULT_SYNTAX;
      this._pointedAt = null; // the variable name under the pointer
      this._pointedLine = null; // the line under the pointer
      this._openValues = new Set(); // variables a viewer opened to their full value, kept across steps
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.sb-code__variable')) {
          e.preventDefault();
          this._openValue(e.target);
        }
      });
      this.addEventListener('input', (e) => {
        if (e.target.matches('.sb-code__slider')) this._moveTo(Number(e.target.value));
      });
      this.addEventListener('pointerover', (e) => {
        this._pointAt(e.target.closest('[data-name].sb-code__name--variable, [data-variable]'));
        this._pointAtLine(e.target.closest('.sb-code__line'));
      });
      this.addEventListener('pointerleave', () => {
        this._pointAt(null);
        this._pointAtLine(null);
      });
      // toggle doesn't bubble, so it's heard on the way down.
      this.addEventListener('toggle', (e) => {
        if (e.target.matches('.sb-code__pane')) this._toggled(e.target);
      }, true);
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-code');
      if (!this.querySelector('.sb-code__body')) {
        const saved = this.id && this._variables !== 'none' ? storage.read(`sb-code:${this.id}`) : null;
        if (saved) this.setAttribute('variables', saved); // a viewer's choice wins over the sandbox's
        this.innerHTML = `
          <div class="sb-code__bar">
            <button type="button" class="sb-code__button" data-move="first" aria-label="First step">⏮</button>
            <button type="button" class="sb-code__button" data-move="back" aria-label="Step back">◀</button>
            <button type="button" class="sb-code__button" data-move="forward" aria-label="Step forward">▶</button>
            <button type="button" class="sb-code__button" data-move="last" aria-label="Last step">⏭</button>
            <input class="sb-code__slider" type="range" min="0" step="1" aria-label="Step">
            <span class="sb-code__count" aria-live="polite"></span>
          </div>
          <div class="sb-code__note" aria-live="polite"></div>
          <div class="sb-code__body">
            <pre class="sb-code__code"></pre>
            <details class="sb-code__pane" open>
              <summary class="sb-code__toggle">Variables</summary>
              <table class="sb-code__variables"><tbody></tbody></table>
            </details>
          </div>`;
      }
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // The code, as text. Any language, or pseudocode.
    get code() { return this._code; }
    set code(text) {
      this._code = String(text ?? '');
      this.render();
    }

    // { keywords, literals, comments }: how to colour the code. Fields left out keep their defaults,
    // and reading it gives the defaults, ready to extend.
    get syntax() { return this._syntax; }
    set syntax(value) {
      this._syntax = { ...DEFAULT_SYNTAX, ...value };
      this.render();
    }

    // [{ line, variables, note }]: each step the model took. Lines count from 1.
    get trace() { return this._trace; }
    set trace(list) {
      this._trace = list || [];
      this._step = clamp(this._step, 0, Math.max(0, this._trace.length - 1));
      this.render();
    }

    // Which step of the trace to show, counting from 0. Setting it doesn't fire sb-step.
    get step() { return this._step; }
    set step(n) {
      this._step = clamp(Math.round(Number(n) || 0), 0, Math.max(0, this._trace.length - 1));
      this._showStep();
    }

    // { lines: [numbers], names: [variable names] }: what to point at.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = value || {};
      this._showHighlight();
    }

    get _variables() { return this.getAttribute('variables') || 'open'; }

    // ---- Rendering ----

    render() {
      const pre = this.querySelector('.sb-code__code');
      if (!this.isConnected || !pre) return;
      const colour = colourer(this._syntax);
      pre.innerHTML = this._code
        ? this._code.split('\n').map((line, i) => `<div class="sb-code__line" data-line="${i + 1}"><span class="sb-code__number">${i + 1}</span><span class="sb-code__text">${colour(line)}</span></div>`).join('')
        : `<div class="sb-code__empty">${esc(this.getAttribute('empty-text') || 'No code yet.')}</div>`;
      this.querySelector('.sb-code__bar').hidden = !this.hasAttribute('controls');
      this._showPane();
      this._showStep();
    }

    // The variables pane: open, closed to its heading, or not there at all.
    _showPane() {
      const pane = this.querySelector('.sb-code__pane');
      pane.hidden = this._variables === 'none';
      pane.open = this._variables !== 'closed';
    }

    // Marks the current line, shows this step's variables and note, and brings the line into view.
    _showStep() {
      if (!this.querySelector('.sb-code__body')) return;
      const current = this._trace[this._step];
      const previous = this._trace[this._step - 1];
      for (const line of this.querySelectorAll('.sb-code__line')) {
        line.classList.toggle('sb-code__line--current', Number(line.dataset.line) === current?.line);
      }
      // The note keeps its place whenever the trace has notes, so the code doesn't jump about.
      const note = this.querySelector('.sb-code__note');
      note.textContent = current?.note ?? '';
      note.hidden = !this._trace.some((entry) => entry.note);
      this._showVariables(current?.variables ?? {}, previous?.variables);
      this._showControls();
      this._showHighlight();
      this._scrollTo(this.querySelector('.sb-code__line--current'));
    }

    // A variable is marked as changed when it differs from the step before, or is new. Each value
    // keeps to one line unless a viewer opened it; hovering shows it in full, and what it was.
    _showVariables(variables, before) {
      this.querySelector('.sb-code__variables tbody').innerHTML = Object.entries(variables).map(([name, value]) => {
        const changed = before && (!(name in before) || show(before[name]) !== show(value));
        const title = show(value) + (changed && name in before ? `\nwas ${show(before[name])}` : '');
        const classes = ['sb-code__variable', changed && 'sb-code__variable--changed', this._openValues.has(name) && 'sb-code__variable--open'].filter(Boolean).join(' ');
        return `<tr class="${classes}" data-variable="${esc(name)}" title="${esc(title)}" tabindex="0" aria-expanded="${this._openValues.has(name)}"><th scope="row">${esc(name)}</th><td>${esc(show(value))}</td></tr>`;
      }).join('');
      // Names in the code that are variables at this step can be pointed at.
      const names = new Set(Object.keys(variables));
      for (const el of this.querySelectorAll('.sb-code__name')) el.classList.toggle('sb-code__name--variable', names.has(el.dataset.name));
    }

    _showControls() {
      const last = Math.max(0, this._trace.length - 1);
      const slider = this.querySelector('.sb-code__slider');
      slider.max = last;
      slider.value = this._step;
      slider.disabled = !this._trace.length;
      for (const button of this.querySelectorAll('.sb-code__button')) {
        const back = button.dataset.move === 'first' || button.dataset.move === 'back';
        button.disabled = !this._trace.length || (back ? this._step === 0 : this._step === last);
      }
      this.querySelector('.sb-code__count').textContent = this._trace.length ? `Step ${this._step + 1} of ${this._trace.length}` : 'No steps';
    }

    // Lights highlighted lines, and every mention of a highlighted or pointed-at variable.
    _showHighlight() {
      const lines = (this._highlight.lines ?? []).map(Number);
      const names = new Set([...(this._highlight.names ?? []), this._pointedAt].filter(Boolean).map(String));
      for (const el of this.querySelectorAll('.sb-code__line')) el.classList.toggle('sb-code__line--highlighted', lines.includes(Number(el.dataset.line)));
      for (const el of this.querySelectorAll('.sb-code__name')) el.classList.toggle('sb-code__name--highlighted', names.has(el.dataset.name));
      for (const el of this.querySelectorAll('.sb-code__variable')) el.classList.toggle('sb-code__variable--highlighted', names.has(el.dataset.variable));
    }

    // Scrolls the code, not the page, to keep a line in view.
    _scrollTo(line) {
      const pane = this.querySelector('.sb-code__code');
      if (!line) return;
      const top = line.offsetTop - pane.offsetTop, bottom = top + line.offsetHeight;
      if (top < pane.scrollTop) pane.scrollTop = top;
      else if (bottom > pane.scrollTop + pane.clientHeight) pane.scrollTop = bottom - pane.clientHeight;
    }

    // ---- Interaction ----

    // A viewer moving through the trace: the step changes, and the sandbox hears about it.
    _moveTo(n) {
      const before = this._step;
      this.step = n;
      if (this._step !== before) this.dispatchEvent(new CustomEvent('sb-step', { bubbles: true, detail: { step: this._step, entry: this._trace[this._step] } }));
    }

    _click(e) {
      const button = e.target.closest('.sb-code__button');
      if (button) {
        const moves = { first: 0, back: this._step - 1, forward: this._step + 1, last: this._trace.length - 1 };
        return this._moveTo(moves[button.dataset.move]);
      }
      const variable = e.target.closest('.sb-code__variable');
      if (variable) return this._openValue(variable);
      const line = e.target.closest('.sb-code__line');
      if (line) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { line: Number(line.dataset.line) } }));
    }

    // A viewer opening or closing the variables: kept in the attribute, so it always says how they
    // are, and remembered with an id. Toggles the sandbox caused already agree with the attribute.
    _toggled(pane) {
      const state = pane.open ? 'open' : 'closed';
      if (pane.hidden || state === this._variables) return;
      this.setAttribute('variables', state);
      if (this.id) storage.write(`sb-code:${this.id}`, state);
    }

    // A viewer opening a value to read it in full, or closing it back to one line.
    _openValue(row) {
      const name = row.dataset.variable;
      if (!this._openValues.delete(name)) this._openValues.add(name);
      row.classList.toggle('sb-code__variable--open', this._openValues.has(name));
      row.setAttribute('aria-expanded', this._openValues.has(name));
    }

    // Tells the page which line is pointed at, so it can light what the line concerns.
    _pointAtLine(el) {
      const line = el ? Number(el.dataset.line) : null;
      if (line === this._pointedLine) return;
      this._pointedLine = line;
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: line == null ? null : { line } }));
    }

    _pointAt(el) {
      const name = el ? el.dataset.name ?? el.dataset.variable : null;
      if (name === this._pointedAt) return;
      this._pointedAt = name;
      this._showHighlight();
    }
  }

  customElements.define('sb-code', SbCode);
})();
