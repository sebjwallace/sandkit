// Sandkit sb-stat 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Headline figures: the few numbers that matter, each with how it changed since the last update
// and whether that's good, how far it is to its target, and a tone when it needs attention.
//
//   stats.stats = [{ id: 'stock', label: 'Stock', value: 37, max: 100, target: 40, better: 'higher' }];
//   stats.stats = [{ id: 'stock', label: 'Stock', value: 31, max: 100, target: 40, better: 'higher' }]; // ▼ 6, in red
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-stat';
  const existing = customElements.get('sb-stat');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-stat>, so only one can run. Rename one by replacing every "sb-stat" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-stat { display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--sb-stat-width, 150px), 1fr)); gap: 10px; }
    .sb-stat__tile { position: relative; padding: 10px 12px; border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); cursor: pointer; }
    .sb-stat__tile[data-tone="good"] { box-shadow: inset 3px 0 0 var(--sb-good, #3f9142); }
    .sb-stat__tile[data-tone="warn"] { box-shadow: inset 3px 0 0 var(--sb-warn, #d69e2e); }
    .sb-stat__tile[data-tone="bad"] { box-shadow: inset 3px 0 0 var(--sb-bad, #c53030); }
    .sb-stat__tile--highlighted { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    .sb-stat__label { color: var(--sb-muted, #616e7c); font-size: 12px; font-weight: 600; }
    .sb-stat__figure { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
    .sb-stat__value { color: var(--sb-text, #1f2933); font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.3; }
    .sb-stat__tile[data-tone="bad"] .sb-stat__value { color: var(--sb-bad, #c53030); }
    .sb-stat__tile[data-tone="warn"] .sb-stat__value { color: var(--sb-warn, #d69e2e); }
    .sb-stat__unit { margin-left: 2px; font-size: 14px; font-weight: 600; color: var(--sb-muted, #616e7c); }
    .sb-stat__change { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--sb-muted, #616e7c); }
    .sb-stat__change[data-verdict="good"] { color: var(--sb-good, #3f9142); }
    .sb-stat__change[data-verdict="bad"] { color: var(--sb-bad, #c53030); }
    .sb-stat__meter { position: relative; height: 5px; margin: 6px 0 2px; border-radius: 3px; background: var(--sb-border, #d5d9e0); }
    .sb-stat__fill { position: absolute; inset: 0 auto 0 0; border-radius: 3px; background: var(--sb-accent, #2563eb); }
    .sb-stat__tile[data-tone="good"] .sb-stat__fill { background: var(--sb-good, #3f9142); }
    .sb-stat__tile[data-tone="warn"] .sb-stat__fill { background: var(--sb-warn, #d69e2e); }
    .sb-stat__tile[data-tone="bad"] .sb-stat__fill { background: var(--sb-bad, #c53030); }
    .sb-stat__target { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; background: var(--sb-text, #1f2933); }
    .sb-stat__note { margin-top: 2px; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-stat__empty { color: var(--sb-muted, #616e7c); }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const percent = (value, max) => Math.max(0, Math.min(100, (value / max) * 100));
  const plain = (value) => (typeof value === 'number' ? value.toLocaleString('en') : String(value ?? '—'));

  function addStyle() {
    if (document.getElementById('sb-stat-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-stat-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Whether a change is good news: a rise is good when higher is better, bad when lower is.
  function verdict(change, better) {
    if (!change || !better) return 'neutral';
    return (change > 0) === (better === 'higher') ? 'good' : 'bad';
  }

  class SbStat extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['empty-text'];

    constructor() {
      super();
      this._stats = [];
      this._previous = new Map(); // each stat's value when last set, by id
      this._changes = new Map();
      this._highlight = [];
      this.addEventListener('click', (e) => {
        const tile = e.target.closest('.sb-stat__tile');
        if (tile) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { stat: this._stats[tile.dataset.index] } }));
      });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-stat');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ id, label, value, unit, format, max, target, better, tone, note }]. Setting them again
    // shows how each numeric value changed since last time, matched by id.
    get stats() { return this._stats; }
    set stats(list) {
      this._stats = list || [];
      this._changes = new Map(this._stats.filter((s) => s.id != null).map((s) => {
        const before = this._previous.get(String(s.id));
        const change = typeof before === 'number' && typeof s.value === 'number' ? s.value - before : 0;
        return [String(s.id), change];
      }));
      this._previous = new Map(this._stats.filter((s) => s.id != null).map((s) => [String(s.id), s.value]));
      this.render();
    }

    // Ids of the stats to point at.
    get highlight() { return this._highlight; }
    set highlight(ids) {
      this._highlight = (ids || []).map(String);
      for (const tile of this.querySelectorAll('.sb-stat__tile')) {
        tile.classList.toggle('sb-stat__tile--highlighted', this._highlight.includes(tile.dataset.id));
      }
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      this.innerHTML = this._stats.length
        ? this._stats.map((stat, i) => this._tile(stat, i)).join('')
        : `<div class="sb-stat__empty">${esc(this.getAttribute('empty-text') || 'Nothing yet.')}</div>`;
      this.highlight = this._highlight;
    }

    _tile(stat, index) {
      const show = stat.format ?? plain;
      const change = this._changes.get(String(stat.id)) ?? 0;
      const tone = stat.tone ? ` data-tone="${esc(stat.tone)}"` : '';
      const unit = stat.unit ? `<span class="sb-stat__unit">${esc(stat.unit)}</span>` : '';
      return `
        <div class="sb-stat__tile" data-index="${index}" data-id="${esc(stat.id)}"${tone}>
          <div class="sb-stat__label">${esc(stat.label ?? stat.id)}</div>
          <div class="sb-stat__figure">
            <span class="sb-stat__value">${esc(show(stat.value))}${unit}</span>
            ${change ? this._change(change, stat, show) : ''}
          </div>
          ${this._meter(stat, show)}
          ${stat.note != null ? `<div class="sb-stat__note">${esc(stat.note)}</div>` : ''}
        </div>`;
    }

    // ▲ or ▼ and by how much, in the stat's own format, coloured by whether it's good news.
    _change(change, stat, show) {
      const text = `${change > 0 ? '▲' : '▼'} ${esc(show(Math.abs(change)))}`;
      return `<span class="sb-stat__change" data-verdict="${verdict(change, stat.better)}" title="${change > 0 ? 'Up' : 'Down'} since the last update">${text}</span>`;
    }

    // With a max, a bar of the value out of it, the target marked on it. Without, the target in words.
    _meter(stat, show) {
      if (stat.max) {
        const target = stat.target != null ? `<span class="sb-stat__target" style="left: ${percent(stat.target, stat.max)}%" title="Target ${esc(show(stat.target))}"></span>` : '';
        return `<div class="sb-stat__meter" role="meter" aria-valuemin="0" aria-valuemax="${esc(stat.max)}" aria-valuenow="${esc(stat.value)}" aria-label="${esc(stat.label ?? stat.id)}"><span class="sb-stat__fill" style="width: ${percent(stat.value, stat.max)}%"></span>${target}</div>`;
      }
      return stat.target != null ? `<div class="sb-stat__note">Target ${esc(show(stat.target))}</div>` : '';
    }
  }

  customElements.define('sb-stat', SbStat);
})();
