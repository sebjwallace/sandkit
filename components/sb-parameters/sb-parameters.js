// Sandkit sb-parameters · MIT Licence · https://github.com/sebjwallace/sandkit
// The knobs of a sandbox: the values people change to see what happens. Shows each parameter
// with its live value, marks any that differ from their defaults, and resets them.
//
//   params.definitions = [{ key: 'demand', label: 'Customer demand', min: 0.5, max: 2.5, step: 0.1, value: 1, unit: '×' }];
//   params.addEventListener('sb-change', (e) => model.setOption(e.detail.key, e.detail.value));
//
// Children marked slot="<key>" are placed beside that parameter's name: the sandbox's own content,
// which this component shows but never inspects.
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-parameters';
  const existing = customElements.get('sb-parameters');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-parameters>, so only one can run. Rename one by replacing every "sb-parameters" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-parameters { display: grid; gap: 12px; font-size: 13px; color: var(--sb-text, #1f2933); }
    .sb-parameters__parameter { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 2px 8px; }
    .sb-parameters__name { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; }
    .sb-parameters__label { display: flex; align-items: baseline; gap: 6px; }
    .sb-parameters__value { font-weight: 600; font-variant-numeric: tabular-nums; }
    .sb-parameters__input { grid-column: 1 / -1; width: 100%; margin: 2px 0 0; accent-color: var(--sb-accent, #2563eb); }
    .sb-parameters__default { grid-column: 1 / -1; font-size: 11px; color: var(--sb-muted, #616e7c); }
    .sb-parameters__parameter:not([data-changed]) .sb-parameters__default { display: none; }
    .sb-parameters__parameter[data-changed] .sb-parameters__value { color: var(--sb-accent, #2563eb); }
    .sb-parameters__parameter[data-changed] .sb-parameters__label::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--sb-accent, #2563eb); align-self: center; }
    .sb-parameters__reset { justify-self: start; font: inherit; font-size: 12px; padding: 4px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); cursor: pointer; }
    .sb-parameters__reset:hover { background: var(--sb-surface-2, #eef0f3); }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-parameters-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-parameters-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  const clamp = (value, { min, max }) => Math.min(max, Math.max(min, value));

  // Shows as many decimal places as the step has, so 0.1 steps read 1.0, 1.1, 1.2.
  function format(definition, value) {
    if (definition.format) return definition.format(value);
    const decimals = (String(definition.step ?? 1).split('.')[1] || '').length;
    const number = value.toFixed(decimals);
    if (!definition.unit) return number;
    return /^[a-z]/i.test(definition.unit) ? `${number} ${definition.unit}` : `${number}${definition.unit}`;
  }

  let instanceCount = 0; // gives each instance unique input ids

  class SbParameters extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._id = `sb-parameters-${++instanceCount}`;
      this._definitions = [];
      this._values = {};
      this._slotted = {}; // the sandbox's content for each parameter, by key
      this.addEventListener('input', (e) => this._onInput(e));
      this.addEventListener('click', (e) => {
        if (e.target.closest('.sb-parameters__reset')) this.reset();
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-parameters');
      this.render();
    }

    // ---- Public API ----

    // [{ key, label, min, max, step, value, unit, format }]. `value` is the default.
    get definitions() { return this._definitions; }
    set definitions(list) {
      this._definitions = list || [];
      this._values = Object.fromEntries(this._definitions.map((d) => [d.key, d.value]));
      this.render();
    }

    // The current value of every parameter, by key.
    get values() { return { ...this._values }; }
    set values(values) {
      for (const d of this._definitions) {
        if (d.key in values) this._values[d.key] = clamp(Number(values[d.key]), d);
      }
      this.render();
    }

    // Returns every parameter to its default, announcing each one that changes.
    reset() {
      const changed = this._definitions.filter((d) => this._values[d.key] !== d.value);
      for (const d of changed) this._values[d.key] = d.value;
      this.render();
      for (const d of changed) this._announce(d);
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      this._takeSlotted();
      this.innerHTML = this._definitions.map((d) => this._parameter(d)).join('') +
        '<button type="button" class="sb-parameters__reset">Reset to defaults</button>';
      this._placeSlotted();
      this._showChanges();
    }

    // Slotted children are kept across re-renders, then put back beside their parameter's name.
    _takeSlotted() {
      for (const el of this.querySelectorAll(':scope > [slot]')) {
        (this._slotted[el.slot] ||= []).push(el);
      }
    }

    _placeSlotted() {
      for (const [key, elements] of Object.entries(this._slotted)) {
        this._row(key)?.querySelector('.sb-parameters__name').append(...elements);
      }
    }

    _parameter(d) {
      const value = this._values[d.key];
      const inputId = `${this._id}-${d.key}`;
      return `
        <div class="sb-parameters__parameter" data-key="${esc(d.key)}">
          <div class="sb-parameters__name"><label class="sb-parameters__label" for="${inputId}">${esc(d.label ?? d.key)}</label></div>
          <output class="sb-parameters__value" for="${inputId}">${esc(format(d, value))}</output>
          <input class="sb-parameters__input" id="${inputId}" type="range" data-key="${esc(d.key)}"
            min="${d.min}" max="${d.max}" step="${d.step ?? 1}" value="${value}" aria-valuetext="${esc(format(d, value))}">
          <span class="sb-parameters__default">Default ${esc(format(d, d.value))}</span>
        </div>`;
    }

    // Marks parameters that differ from their defaults, and offers reset only when something does.
    _showChanges() {
      let anyChanged = false;
      for (const d of this._definitions) {
        const changed = this._values[d.key] !== d.value;
        this._row(d.key).toggleAttribute('data-changed', changed);
        anyChanged ||= changed;
      }
      this.querySelector('.sb-parameters__reset').hidden = !anyChanged;
    }

    _row(key) {
      return [...this.querySelectorAll('.sb-parameters__parameter')].find((row) => row.dataset.key === key);
    }

    // ---- Interaction ----

    // Updates in place while dragging, so the slider is never replaced under the pointer.
    _onInput(e) {
      const d = this._definitions.find((def) => def.key === e.target.dataset.key);
      if (!d) return;
      const value = Number(e.target.value);
      this._values[d.key] = value;
      const text = format(d, value);
      this._row(d.key).querySelector('.sb-parameters__value').textContent = text;
      e.target.setAttribute('aria-valuetext', text);
      this._showChanges();
      this._announce(d);
    }

    _announce(d) {
      this.dispatchEvent(new CustomEvent('sb-change', {
        bubbles: true,
        detail: { key: d.key, value: this._values[d.key], values: this.values }
      }));
    }
  }

  customElements.define('sb-parameters', SbParameters);
})();
