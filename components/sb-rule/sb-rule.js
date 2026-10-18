// Sandkit sb-rule 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// One rule as a card: a mandate, a conditional, or any shape the sandbox writes as keyword lines.
// The model says which lines apply now and whether the rule holds; the card shows it.
//
//   <sb-rule></sb-rule>
//   card.rule = { kind: 'MANDATE', code: 'R1', lines: [{ text: 'critical feeders MUST NOT disconnect' }] };
//   card.path = [0]; card.status = 'holds';
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-rule';
  const existing = customElements.get('sb-rule');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-rule>, so only one can run. Rename one by replacing every "sb-rule" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-rule { display: block; padding: 12px 14px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font-size: 13px; line-height: 1.45; transition: border-color 0.15s, box-shadow 0.15s; }
    .sb-rule--highlighted { border-color: var(--sb-accent, #2563eb); box-shadow: 0 0 0 3px var(--sb-accent-soft, #eaf0ff); }
    .sb-rule[data-status="broken"] { border-color: var(--sb-bad, #c53030); }
    .sb-rule__head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
    .sb-rule__kind { font: 700 11px ui-monospace, Menlo, Consolas, monospace; letter-spacing: 0.06em; color: var(--sb-muted, #616e7c); }
    .sb-rule__code { flex: none; padding: 1px 7px; border-radius: 999px; background: var(--sb-surface-2, #eef0f3); color: var(--sb-muted, #616e7c); font: 600 11px ui-monospace, Menlo, Consolas, monospace; }
    .sb-rule__title { font-weight: 600; }
    .sb-rule__status { margin-left: auto; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .sb-rule__status[data-status="holds"] { color: var(--sb-good, #3f9142); background: var(--sb-surface-2, #eef0f3); }
    .sb-rule__status[data-status="broken"] { color: #fff; background: var(--sb-bad, #c53030); }
    .sb-rule__status[data-status="idle"] { color: var(--sb-muted, #616e7c); background: var(--sb-surface-2, #eef0f3); }
    .sb-rule__lines { display: grid; grid-template-columns: max-content minmax(0, 1fr); margin: 0; padding: 0; list-style: none; }
    .sb-rule__line { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; padding: 2px 6px; margin: 0 -6px; border-radius: 4px; cursor: pointer; transition: background 0.15s, opacity 0.15s; }
    .sb-rule__line:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-rule__line:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    .sb-rule__keyword { padding-right: 10px; text-transform: uppercase; letter-spacing: 0.06em; font: 700 11px/19px ui-monospace, Menlo, Consolas, monospace; color: var(--sb-accent, #2563eb); white-space: nowrap; }
    .sb-rule__keyword:empty { padding: 0; }
    .sb-rule__text { padding-left: calc(var(--depth, 0) * 1.6em); }
    .sb-rule__modal { font-weight: 700; letter-spacing: 0.03em; }
    .sb-rule__value { padding: 0 3px; border-radius: 3px; background: var(--sb-surface-2, #eef0f3); font-variant-numeric: tabular-nums; font-weight: 600; }
    .sb-rule__line--highlighted { background: var(--sb-accent-soft, #eaf0ff); box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }
    .sb-rule__line--on-path { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-rule__line--off-path { opacity: 0.4; }
    .sb-rule__empty { color: var(--sb-muted, #616e7c); }`;

  const DEFAULT_MODALS = ['MUST NOT', 'MUST', 'MAY'];
  const STATUS_WORDS = { holds: 'holds', broken: 'broken', idle: 'not in force' };

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Modal words, quoted text and standalone numbers, each captured so splitting keeps them at odd indices.
  // Longer modals go first, so MUST NOT wins over MUST.
  const tokenPattern = (modals) => {
    const words = [...modals].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|');
    return new RegExp(`(${words ? `\\b(?:${words})\\b|` : ''}"[^"]*"|(?<!\\w)\\d+(?:[.,]\\d+)?[%°]?(?!\\w))`);
  };

  const markText = (text, pattern, modals) => String(text ?? '').split(pattern).map((part, i) => {
    if (i % 2 === 0) return esc(part);
    return `<span class="sb-rule__${modals.includes(part) ? 'modal' : 'value'}">${esc(part)}</span>`;
  }).join('');

  function addStyle() {
    if (document.getElementById('sb-rule-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-rule-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbRule extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._rule = null;
      this._modals = DEFAULT_MODALS;
      this._path = [];
      this._status = null;
      this._highlight = [];
      this.addEventListener('click', (e) => this._select(e.target));
      this.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.sb-rule__line')) {
          e.preventDefault();
          this._select(e.target);
        }
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-rule');
      this.render();
    }

    // ---- Public API ----

    // { kind, code, title, lines: [{ keyword, text, depth, ref }] }
    get rule() { return this._rule; }
    set rule(value) { this._rule = value; this.render(); }

    // The words that say how binding a line is, marked wherever they appear.
    get modals() { return this._modals; }
    set modals(words) { this._modals = words || DEFAULT_MODALS; this.render(); }

    // Indexes of the lines that apply now; the others fade. Empty shows them all plainly.
    get path() { return this._path; }
    set path(indexes) { this._path = indexes || []; this.render(); }

    // 'holds', 'broken' or 'idle', worked out by the model. null shows no status.
    get status() { return this._status; }
    set status(value) { this._status = value; this.render(); }

    // Refs to light up: the rule's code lights the card, a line's ref lights the line.
    get highlight() { return this._highlight; }
    set highlight(refs) { this._highlight = refs || []; this.render(); }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      const rule = this._rule;
      if (rule?.code != null) this.dataset.ref = rule.code;
      else delete this.dataset.ref;
      if (this._status) this.dataset.status = this._status;
      else delete this.dataset.status;
      this.classList.toggle('sb-rule--highlighted', rule?.code != null && this._highlight.includes(rule.code));
      if (!rule) {
        this.innerHTML = '<div class="sb-rule__empty">No rule yet.</div>';
        return;
      }
      const pattern = tokenPattern(this._modals);
      this.innerHTML = `
        <div class="sb-rule__head">
          ${rule.kind ? `<span class="sb-rule__kind">${esc(rule.kind)}</span>` : ''}
          ${rule.code != null ? `<span class="sb-rule__code">${esc(rule.code)}</span>` : ''}
          ${rule.title ? `<span class="sb-rule__title">${esc(rule.title)}</span>` : ''}
          ${this._status ? `<span class="sb-rule__status" data-status="${esc(this._status)}">${esc(STATUS_WORDS[this._status] ?? this._status)}</span>` : ''}
        </div>
        <ol class="sb-rule__lines">
          ${(rule.lines || []).map((line, index) => this._line(line, index, pattern)).join('')}
        </ol>`;
    }

    _line(line, index, pattern) {
      const onPath = this._path.includes(index);
      const classes = [
        'sb-rule__line',
        this._highlight.includes(line.ref) ? 'sb-rule__line--highlighted' : '',
        onPath ? 'sb-rule__line--on-path' : '',
        this._path.length && !onPath ? 'sb-rule__line--off-path' : ''
      ].filter(Boolean).join(' ');
      return `
        <li class="${classes}" data-index="${index}" tabindex="0"${line.ref != null ? ` data-ref="${esc(line.ref)}"` : ''}>
          <span class="sb-rule__keyword">${esc(line.keyword)}</span>
          <span class="sb-rule__text" style="--depth: ${Number(line.depth) || 0}">${markText(line.text, pattern, this._modals)}</span>
        </li>`;
    }

    // ---- Interaction ----

    // Clicking a line only reports it; the sandbox decides what it means.
    _select(target) {
      const row = target.closest('.sb-rule__line');
      if (!row) return;
      const index = Number(row.dataset.index);
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { rule: this._rule, line: this._rule.lines[index], index } }));
    }
  }

  customElements.define('sb-rule', SbRule);
})();
