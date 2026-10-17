// Sandkit sb-bars 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Bars comparing a set of things on one measure: stock per store, spending per category. Each
// update shows how every bar moved, with a mark where it was, and reference lines give the
// values meaning. Bars run across, or up as columns.
//
//   <sb-bars sort="descending" better="higher"></sb-bars>
//   bars.bars = [{ id: 'north', label: 'North', value: 37 }, { id: 'south', label: 'South', value: 0, tone: 'bad' }];
//   bars.lines = [{ value: 40, label: 'Reorder', tone: 'warn' }];
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-bars';
  const existing = customElements.get('sb-bars');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-bars>, so only one can run. Rename one by replacing every "sb-bars" in its file.`);
    }
    return;
  }

  const TONES = { accent: '#2563eb', good: '#3f9142', warn: '#d69e2e', bad: '#c53030', muted: '#616e7c' };

  const CSS = `
    .sb-bars { display: block; font-size: 13px; }
    .sb-bars__item { cursor: pointer; }
    .sb-bars__item--highlighted .sb-bars__label, .sb-bars__item--highlighted .sb-bars__key { font-weight: 700; color: var(--sb-accent, ${TONES.accent}); }
    .sb-bars__fill { position: absolute; border-radius: 2px; background: var(--sb-accent, ${TONES.accent}); }
    .sb-bars__zero { position: absolute; border: 0 solid var(--sb-border, #d5d9e0); }
    .sb-bars__was { position: absolute; background: var(--sb-muted, ${TONES.muted}); opacity: 0.6; }
    .sb-bars__line { position: absolute; border: 0 dashed var(--sb-muted, ${TONES.muted}); }
    .sb-bars__line-label { position: absolute; font-size: 10px; white-space: nowrap; color: var(--sb-muted, ${TONES.muted}); }
    .sb-bars__line--highlighted { border-style: solid; }
    .sb-bars__line-label--highlighted { font-weight: 700; }
    .sb-bars__value { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .sb-bars__change { font-size: 11px; font-weight: 600; color: var(--sb-muted, ${TONES.muted}); }
    .sb-bars__change[data-verdict="good"] { color: var(--sb-good, ${TONES.good}); }
    .sb-bars__change[data-verdict="bad"] { color: var(--sb-bad, ${TONES.bad}); }
    .sb-bars__empty { color: var(--sb-muted, ${TONES.muted}); }

    /* Across: one grid for every row, so all the bars share one scale. */
    .sb-bars__list { display: grid; grid-template-columns: minmax(3em, max-content) minmax(80px, 1fr) max-content; column-gap: 10px; }
    .sb-bars__head, .sb-bars__row { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; align-items: center; }
    .sb-bars__head { height: 16px; }
    .sb-bars__row { padding: 3px 0; border-radius: 4px; }
    .sb-bars__row:hover, .sb-bars__row.sb-bars__item--highlighted { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-bars__label { padding-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sb-bars__track { position: relative; height: 16px; }
    .sb-bars__head .sb-bars__track { height: 100%; }
    .sb-bars__row .sb-bars__fill { top: 0; bottom: 0; }
    .sb-bars__row .sb-bars__zero { top: -3px; bottom: -3px; border-left-width: 1px; }
    .sb-bars__row .sb-bars__was { top: -2px; bottom: -2px; width: 2px; margin-left: -1px; }
    .sb-bars__row .sb-bars__line { top: -3px; bottom: -3px; border-left-width: 1.5px; }
    .sb-bars__row .sb-bars__line--highlighted { border-left-width: 3px; }
    .sb-bars__head .sb-bars__line-label { bottom: 1px; }
    .sb-bars__row .sb-bars__value { padding-right: 4px; }
    .sb-bars__row .sb-bars__change { margin-left: 6px; }

    /* Up: columns over a shared baseline, values above, labels (or keys and a legend) below. */
    .sb-bars__plot { height: var(--sb-bars-height, 180px); padding-top: 30px; }
    .sb-bars__plot--negative { padding-bottom: 30px; }
    .sb-bars__area { position: relative; display: flex; gap: 6px; height: 100%; margin-right: 80px; }
    .sb-bars__column { position: relative; flex: 1 1 0; min-width: 0; border-radius: 4px; }
    .sb-bars__column:hover, .sb-bars__column.sb-bars__item--highlighted { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-bars__column .sb-bars__fill { left: 15%; right: 15%; }
    .sb-bars__area .sb-bars__zero { left: 0; right: 0; border-top-width: 1px; }
    .sb-bars__column .sb-bars__was { left: 10%; right: 10%; height: 2px; margin-bottom: -1px; }
    .sb-bars__area .sb-bars__line { left: 0; right: 0; border-top-width: 1.5px; }
    .sb-bars__area .sb-bars__line--highlighted { border-top-width: 3px; }
    .sb-bars__area .sb-bars__line-label { left: calc(100% + 6px); width: 74px; transform: translateY(50%); overflow: hidden; text-overflow: ellipsis; }
    .sb-bars__reading { position: absolute; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; line-height: 1.2; font-size: 12px; }
    .sb-bars__labels { display: flex; gap: 6px; padding: 4px 80px 0 0; }
    .sb-bars__labels .sb-bars__label, .sb-bars__labels .sb-bars__key { flex: 1 1 0; min-width: 0; padding: 0; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sb-bars__key { color: var(--sb-muted, ${TONES.muted}); font-variant-numeric: tabular-nums; }
    .sb-bars__legend { display: flex; flex-wrap: wrap; gap: 2px 14px; margin-top: 6px; font-size: 12px; }
    .sb-bars__legend .sb-bars__item { border-radius: 4px; padding: 0 4px; }
    .sb-bars__legend .sb-bars__item:hover, .sb-bars__legend .sb-bars__item--highlighted { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-bars__legend .sb-bars__key { margin-right: 4px; font-weight: 600; }
    ${Object.entries(TONES).map(([tone, colour]) => `
    .sb-bars__item[data-tone="${tone}"] .sb-bars__fill { background: var(--sb-${tone}, ${colour}); }
    .sb-bars__line[data-tone="${tone}"] { border-color: var(--sb-${tone}, ${colour}); }
    .sb-bars__line-label[data-tone="${tone}"] { color: var(--sb-${tone}, ${colour}); }`).join('')}`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const plain = (value) => (typeof value === 'number' ? value.toLocaleString('en') : String(value ?? ''));
  const nameOf = (item) => String(item.id ?? item.label);

  function addStyle() {
    if (document.getElementById('sb-bars-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-bars-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Whether a change is good news: a rise is good when higher is better, bad when lower is.
  function verdict(change, better) {
    if (!change || !better) return 'neutral';
    return (change > 0) === (better === 'higher') ? 'good' : 'bad';
  }

  class SbBars extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['orientation', 'sort', 'better', 'min', 'max', 'empty-text'];

    constructor() {
      super();
      this._bars = [];
      this._lines = [];
      this._format = plain;
      this._previous = new Map(); // each bar's value when last set, by id
      this._was = new Map();      // each bar's value the time before, for this update's changes
      this._highlight = [];
      this._pointedAt = null;     // the bar under the pointer, by name
      // Columns check their labels fit whenever the space they're given changes.
      this._resizeObserver = new ResizeObserver(() => this._fitWidth());
      this.addEventListener('click', (e) => {
        const item = e.target.closest('.sb-bars__item');
        if (item) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { bar: this._bars[item.dataset.index] } }));
      });
      this.addEventListener('pointerover', (e) => this._pointAt(e.target.closest('.sb-bars__item')?.dataset.name ?? null));
      this.addEventListener('pointerleave', () => this._pointAt(null));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-bars');
      this._resizeObserver.observe(this);
      this.render();
    }

    disconnectedCallback() {
      this._resizeObserver.disconnect();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ id, label, value, tone }]. Setting them again shows how each bar moved since last time, by id.
    get bars() { return this._bars; }
    set bars(list) {
      this._bars = list || [];
      this._was = new Map(this._bars.filter((b) => b.id != null && typeof this._previous.get(String(b.id)) === 'number')
        .map((b) => [String(b.id), this._previous.get(String(b.id))]));
      this._previous = new Map(this._bars.filter((b) => b.id != null).map((b) => [String(b.id), b.value]));
      this.render();
    }

    // [{ id, value, label, tone }]: reference lines across every bar, such as a target or a limit.
    get lines() { return this._lines; }
    set lines(list) {
      this._lines = list || [];
      this.render();
    }

    // (value) => text, for the values and the changes. Defaults to plain numbers.
    get format() { return this._format; }
    set format(fn) {
      this._format = fn || plain;
      this.render();
    }

    // Ids (or labels) of bars and reference lines to point at.
    get highlight() { return this._highlight; }
    set highlight(ids) {
      this._highlight = (ids || []).map(String);
      this._showHighlight();
    }

    // ---- Rendering ----

    get _vertical() { return this.getAttribute('orientation') === 'vertical'; }

    render() {
      if (!this.isConnected) return;
      this._drawnWidth = this.clientWidth;
      if (!this._bars.length) {
        this.innerHTML = `<div class="sb-bars__empty">${esc(this.getAttribute('empty-text') || 'Nothing yet.')}</div>`;
        return;
      }
      const at = this._scale();
      this.innerHTML = this._vertical ? this._columns(at, false) : this._rows(at);
      // Columns too narrow for their labels give each a number, and name them in a legend instead.
      if (this._vertical && [...this.querySelectorAll('.sb-bars__labels .sb-bars__label')].some((l) => l.scrollWidth > l.clientWidth)) {
        this.innerHTML = this._columns(at, true);
      }
      this._showHighlight();
    }

    _fitWidth() {
      if (this._vertical && this.clientWidth && this.clientWidth !== this._drawnWidth) this.render();
    }

    // Where a value falls along the bars, as a percentage. The scale always includes zero, every
    // bar and line, and the least range set by min and max.
    _scale() {
      const values = this._bars.map((b) => b.value).concat(this._lines.map((l) => l.value)).filter((v) => typeof v === 'number');
      const attr = (name) => (this.hasAttribute(name) ? Number(this.getAttribute(name)) : null);
      const low = Math.min(0, ...values, attr('min') ?? 0);
      const high = Math.max(0, ...values, attr('max') ?? 0);
      const span = high > low ? high - low : 1;
      return (v) => ((v - low) / span) * 100;
    }

    _sorted() {
      const items = this._bars.map((bar, index) => ({ bar, index }));
      const sort = this.getAttribute('sort');
      if (sort !== 'ascending' && sort !== 'descending') return items;
      const sign = sort === 'descending' ? -1 : 1;
      return items.sort((a, b) => sign * ((a.bar.value ?? 0) - (b.bar.value ?? 0)));
    }

    // What every bar shares, whichever way it runs.
    _bar(bar, index) {
      const was = this._was.get(String(bar.id));
      const change = was != null ? bar.value - was : 0;
      const label = bar.label ?? bar.id;
      const attrs = `data-index="${index}" data-name="${esc(nameOf(bar))}"${bar.tone ? ` data-tone="${esc(bar.tone)}"` : ''} title="${esc(label)}: ${esc(this._format(bar.value))}"`;
      return { was, change, label, attrs };
    }

    // ▲ or ▼ and by how much, coloured by whether it's good news.
    _change(change) {
      return `<span class="sb-bars__change" data-verdict="${verdict(change, this.getAttribute('better'))}">${change > 0 ? '▲' : '▼'} ${esc(this._format(Math.abs(change)))}</span>`;
    }

    _line(line, at, side) {
      const tone = line.tone ? ` data-tone="${esc(line.tone)}"` : '';
      return `<span class="sb-bars__line"${tone} data-name="${esc(nameOf(line))}" style="${side}: ${at(line.value)}%"></span>`;
    }

    _lineLabel(line, style) {
      const tone = line.tone ? ` data-tone="${esc(line.tone)}"` : '';
      return `<span class="sb-bars__line-label"${tone} data-name="${esc(nameOf(line))}" style="${style}">${esc(line.label)}</span>`;
    }

    // ---- Across ----

    _rows(at) {
      // A line's label is centred on it, unless that would push it past either end.
      const labels = this._lines.map((l) => {
        const x = at(l.value), shift = x < 10 ? 0 : x > 90 ? -100 : -50;
        return this._lineLabel(l, `left: ${x}%; transform: translateX(${shift}%)`);
      }).join('');
      const head = this._lines.length ? `<div class="sb-bars__head" aria-hidden="true"><span></span><span class="sb-bars__track">${labels}</span><span></span></div>` : '';
      return `<div class="sb-bars__list" role="list">${head}${this._sorted().map(({ bar, index }) => this._row(bar, index, at)).join('')}</div>`;
    }

    _row(bar, index, at) {
      const { was, change, label, attrs } = this._bar(bar, index);
      const zero = at(0), end = at(bar.value ?? 0);
      return `
        <div class="sb-bars__item sb-bars__row" role="listitem" ${attrs}>
          <span class="sb-bars__label">${esc(label)}</span>
          <span class="sb-bars__track">
            <span class="sb-bars__fill" style="left: ${Math.min(zero, end)}%; width: ${Math.abs(end - zero)}%"></span>
            <span class="sb-bars__zero" style="left: ${zero}%"></span>
            ${change ? `<span class="sb-bars__was" style="left: ${at(was)}%" title="Was ${esc(this._format(was))}"></span>` : ''}
            ${this._lines.map((l) => this._line(l, at, 'left')).join('')}
          </span>
          <span class="sb-bars__value">${esc(this._format(bar.value))}${change ? this._change(change) : ''}</span>
        </div>`;
    }

    // ---- Up ----

    // Columns over a shared baseline, with reference lines labelled at the right. Below them, each
    // column's label, or its number and a legend naming them all.
    _columns(at, keyed) {
      const sorted = this._sorted();
      const zero = at(0);
      const columns = sorted.map(({ bar, index }) => {
        const { was, change, attrs } = this._bar(bar, index);
        const end = at(bar.value ?? 0);
        // The reading sits beyond the bar's end, and beyond where it was, so the mark never
        // crosses it: above a bar that rises from zero, below one that falls.
        const ends = change ? [end, at(was)] : [end];
        const reading = end >= zero ? `bottom: ${Math.max(...ends)}%` : `top: ${100 - Math.min(...ends)}%`;
        return `
          <div class="sb-bars__item sb-bars__column" role="listitem" ${attrs}>
            <span class="sb-bars__fill" style="bottom: ${Math.min(zero, end)}%; height: ${Math.abs(end - zero)}%"></span>
            ${change ? `<span class="sb-bars__was" style="bottom: ${at(was)}%" title="Was ${esc(this._format(was))}"></span>` : ''}
            <span class="sb-bars__reading" style="${reading}"><span class="sb-bars__value">${esc(this._format(bar.value))}</span>${change ? this._change(change) : ''}</span>
          </div>`;
      }).join('');
      const under = sorted.map(({ bar, index }) => {
        const { label, attrs } = this._bar(bar, index);
        return keyed
          ? `<span class="sb-bars__item sb-bars__key" ${attrs}>${index + 1}</span>`
          : `<span class="sb-bars__item sb-bars__label" ${attrs}>${esc(label)}</span>`;
      }).join('');
      const legend = keyed ? `<div class="sb-bars__legend">${this._bars.map((bar, index) => {
        const { label, attrs } = this._bar(bar, index);
        return `<span class="sb-bars__item" ${attrs}><span class="sb-bars__key">${index + 1}</span>${esc(label)}</span>`;
      }).join('')}</div>` : '';
      // Room below for the readings of columns that fall below zero.
      const negative = this._bars.some((b) => b.value < 0) ? ' sb-bars__plot--negative' : '';
      return `
        <div class="sb-bars__plot${negative}">
          <div class="sb-bars__area" role="list">
            <span class="sb-bars__zero" style="bottom: ${zero}%"></span>
            ${this._lines.map((l) => this._line(l, at, 'bottom') + this._lineLabel(l, `bottom: ${at(l.value)}%`)).join('')}
            ${columns}
          </div>
        </div>
        <div class="sb-bars__labels" aria-hidden="${keyed}">${under}</div>
        ${legend}`;
    }

    // ---- Pointing ----

    // Lights what is highlighted or pointed at: a bar, wherever it appears (its bar, its label or
    // key, its legend entry), and reference lines.
    _showHighlight() {
      const names = new Set([...this._highlight, this._pointedAt].filter(Boolean));
      for (const el of this.querySelectorAll('.sb-bars__item')) el.classList.toggle('sb-bars__item--highlighted', names.has(el.dataset.name));
      for (const el of this.querySelectorAll('.sb-bars__line')) el.classList.toggle('sb-bars__line--highlighted', names.has(el.dataset.name));
      for (const el of this.querySelectorAll('.sb-bars__line-label')) el.classList.toggle('sb-bars__line-label--highlighted', names.has(el.dataset.name));
    }

    _pointAt(name) {
      if (name === this._pointedAt) return;
      this._pointedAt = name;
      this._showHighlight();
    }
  }

  customElements.define('sb-bars', SbBars);
})();
