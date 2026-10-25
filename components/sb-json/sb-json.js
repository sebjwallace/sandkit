// Sandkit sb-json 0.1.2 · MIT Licence · https://github.com/sebjwallace/sandkit
// JSON shown cleanly, with the parts that matter in the spotlight and the rest folded away, so
// prose about a large payload can point at exactly the lines it means. Clicking a line shows its
// path; pointing at one shows any note the sandbox wrote for it.
//
//   json.value = { order: { id: 'A1', total: 4200, items: [...] } };
//   json.spotlight = ['order.total'];
//   json.notes = { 'order.total': 'In pence, not pounds.' };
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-json';
  const existing = customElements.get('sb-json');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-json>, so only one can run. Rename one by replacing every "sb-json" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-json { display: block; font-size: 13px; }
    .sb-json__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin-bottom: 6px; }
    .sb-json__path { flex: 1 1 200px; min-width: 0; overflow-wrap: anywhere; font: 600 12.5px ui-monospace, Menlo, Consolas, monospace; color: var(--sb-accent, #2563eb); }
    .sb-json__path--empty { font: 12px var(--sb-font, system-ui); color: var(--sb-muted, #616e7c); }
    .sb-json__toggle { padding: 3px 10px; font: inherit; font-size: 12px; color: var(--sb-text, #1f2933); background: var(--sb-surface-2, #eef0f3); border: 0; border-radius: var(--sb-radius, 8px); cursor: pointer; }
    .sb-json__toggle[hidden] { display: none; }
    .sb-json__toggle:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-json__note { position: fixed; inset: auto; margin: 0; max-width: 300px; padding: 6px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-top: 3px solid var(--sb-accent, #2563eb); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18); font: 13px/1.45 var(--sb-font, system-ui, sans-serif); }
    .sb-json__code { max-height: var(--sb-json-height, none); overflow: auto; padding: 6px 0; border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); font: 12.5px/1.6 ui-monospace, Menlo, Consolas, monospace; }
    .sb-json__line, .sb-json__gap { display: flex; padding-right: 12px; cursor: pointer; outline: none; }
    .sb-json__line:focus-visible, .sb-json__gap:focus-visible { box-shadow: inset 0 0 0 2px var(--sb-accent, #2563eb); }
    .sb-json__gutter { flex: none; width: 3.5em; padding-right: 1em; text-align: right; color: var(--sb-muted, #616e7c); user-select: none; }
    .sb-json__text { flex: 1; white-space: pre; }
    .sb-json__line--spotlit { box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }
    .sb-json__line--spotlit .sb-json__gutter { color: var(--sb-accent, #2563eb); }
    .sb-json__line--hovered { background: color-mix(in srgb, var(--sb-accent, #2563eb) 7%, transparent); }
    .sb-json__line--selected { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-json__line--highlighted { background: color-mix(in srgb, var(--sb-accent, #2563eb) 22%, transparent); }
    .sb-json__line--noted .sb-json__text::after { content: ''; display: inline-block; width: 6px; height: 6px; margin-left: 8px; border: 1.5px solid var(--sb-accent, #2563eb); border-radius: 50%; vertical-align: middle; }
    .sb-json__gap { color: var(--sb-muted, #616e7c); font-style: italic; }
    .sb-json__gap:hover { color: var(--sb-text, #1f2933); }
    .sb-json__gap--holds-highlight { color: var(--sb-accent, #2563eb); background: color-mix(in srgb, var(--sb-accent, #2563eb) 12%, transparent); }
    .sb-json__key { color: var(--sb-text, #1f2933); font-weight: 600; }
    .sb-json__string { color: var(--sb-good, #3f9142); }
    .sb-json__number, .sb-json__literal { color: var(--sb-warn, #b7791f); }
    .sb-json__punct { color: var(--sb-muted, #616e7c); }
    .sb-json__empty { color: var(--sb-muted, #616e7c); }`;

  const NOTE_GAP = 6;
  const VIEWPORT_MARGIN = 8;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const isContainer = (value) => value !== null && typeof value === 'object';

  function addStyle() {
    if (document.getElementById('sb-json-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-json-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Paths read as they would in code: order.items[0].price, or ["odd key"] where a key isn't a name.
  const NAME = /^[A-Za-z_$][\w$]*$/;
  function childPath(parent, key) {
    if (typeof key === 'number') return `${parent}[${key}]`;
    if (NAME.test(key)) return parent ? `${parent}.${key}` : key;
    return `${parent}[${JSON.stringify(key)}]`;
  }

  // Whether a path is the outer path or lies inside it. The whole document's path is ''.
  const within = (path, outer) => outer === '' || path === outer || path.startsWith(`${outer}.`) || path.startsWith(`${outer}[`);

  const punct = (s) => `<span class="sb-json__punct">${s}</span>`;
  function scalarHtml(value) {
    const kind = typeof value === 'string' ? 'string' : typeof value === 'number' ? 'number' : 'literal';
    return `<span class="sb-json__${kind}">${esc(JSON.stringify(value))}</span>`;
  }

  // The document as printed lines, each knowing the path it belongs to. A container's opening and
  // closing lines both belong to it; `starts` marks the line where a path begins.
  function print(root) {
    const lines = [];
    const values = new Map();
    (function walk(value, path, depth, key, last) {
      values.set(path, value);
      const indent = '  '.repeat(depth);
      const label = typeof key === 'string' ? `<span class="sb-json__key">${esc(JSON.stringify(key))}</span>${punct(':')} ` : '';
      const comma = last ? '' : punct(',');
      const members = isContainer(value) ? Object.entries(value) : [];
      if (!members.length) {
        const text = isContainer(value) ? punct(Array.isArray(value) ? '[]' : '{}') : scalarHtml(value);
        lines.push({ path, depth, starts: true, html: indent + label + text + comma });
        return;
      }
      const [open, close] = Array.isArray(value) ? ['[', ']'] : ['{', '}'];
      lines.push({ path, depth, starts: true, html: indent + label + punct(open) });
      members.forEach(([k, v], i) => {
        const memberKey = Array.isArray(value) ? i : k;
        walk(v, childPath(path, memberKey), depth + 1, Array.isArray(value) ? null : k, i === members.length - 1);
      });
      lines.push({ path, depth, starts: false, html: indent + punct(close) + comma });
    })(root, '', 0, null, true);
    return { lines, values };
  }

  let instanceCount = 0; // links each instance's noted lines to its own note card

  class SbJson extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['expanded', 'empty-text'];

    constructor() {
      super();
      this._value = undefined;
      this._lines = [];
      this._values = new Map();
      this._spotlight = [];
      this._notes = {};
      this._highlight = [];
      this._selected = null;
      this._hovered = null;
      this._opened = new Set(); // lines a viewer unfolded by clicking a gap
      this._noteId = `sb-json-note-${++instanceCount}`;
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('keydown', (e) => this._key(e));
      this.addEventListener('pointerover', (e) => {
        const row = e.target.closest('.sb-json__line');
        this._hover(row?.dataset.path ?? null);
        this._showNote(row);
      });
      this.addEventListener('pointerleave', () => {
        this._hover(null);
        this._showNote(null);
      });
      this.addEventListener('focusin', (e) => this._showNote(e.target.closest('.sb-json__line')));
      this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this._showNote(null); });
      this._onScroll = () => this._showNote(null);
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-json');
      document.addEventListener('scroll', this._onScroll, { capture: true, passive: true });
      this.render();
    }

    disconnectedCallback() {
      document.removeEventListener('scroll', this._onScroll, { capture: true });
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // Any JSON value. Copied as JSON, so what's shown is exactly what JSON.stringify would write.
    get value() { return this._value; }
    set value(value) {
      this._value = value === undefined ? undefined : JSON.parse(JSON.stringify(value));
      this._opened.clear();
      this.render();
    }

    // The paths that matter. Everything else folds away, unless the viewer expands it.
    get spotlight() { return this._spotlight; }
    set spotlight(paths) {
      this._spotlight = (paths || []).map(String);
      this._opened.clear();
      this.render();
    }

    // Whether everything shows, with the spotlight still marked.
    get expanded() { return this.hasAttribute('expanded'); }
    set expanded(on) { this.toggleAttribute('expanded', Boolean(on)); }

    // { path: text }: what a part means, shown beside a line of it while pointed at or focused.
    get notes() { return this._notes; }
    set notes(notes) {
      this._notes = notes || {};
      this.render();
    }

    // The selected path, or null.
    get selected() { return this._selected; }
    set selected(path) {
      this._selected = path == null ? null : String(path);
      this._showState();
    }

    // Paths to point at. One folded away marks the gap that hides it.
    get highlight() { return this._highlight; }
    set highlight(paths) {
      this._highlight = (paths || []).map(String);
      this._showState();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (this._value === undefined) {
        this._lines = [];
        this.innerHTML = `<div class="sb-json__empty">${esc(this.getAttribute('empty-text') || 'No data yet.')}</div>`;
        return;
      }
      ({ lines: this._lines, values: this._values } = print(this._value));
      const focusedPath = this.querySelector('.sb-json__line:focus')?.dataset.path;
      this.innerHTML = `
        <div class="sb-json__bar">
          <span class="sb-json__path"></span>
          <button type="button" class="sb-json__toggle"></button>
        </div>
        <div class="sb-json__code" role="listbox" aria-label="JSON">${this._rowsHtml()}</div>
        <div class="sb-json__note" id="${this._noteId}" popover="manual" role="tooltip"></div>`;
      this._showState();
      if (focusedPath != null) this._line(focusedPath)?.focus();
    }

    // Shown lines, with each run of hidden ones folded into a gap that says how many. A single
    // hidden line is shown instead, as its gap would take the same room.
    _rowsHtml() {
      const rows = [];
      let hidden = [];
      const lineHtml = (i) => `<div class="sb-json__line" role="option" tabindex="-1" data-path="${esc(this._lines[i].path)}" data-index="${i}"><span class="sb-json__gutter">${i + 1}</span><span class="sb-json__text">${this._lines[i].html}</span></div>`;
      const foldHidden = () => {
        if (hidden.length === 1) rows.push(lineHtml(hidden[0]));
        if (hidden.length > 1) {
          const indent = '  '.repeat(this._lines[hidden[0]].depth);
          rows.push(`<div class="sb-json__gap" role="option" tabindex="-1" data-from="${hidden[0]}" data-to="${hidden.at(-1)}"><span class="sb-json__gutter"></span><span class="sb-json__text">${indent}⋯ ${hidden.length} lines</span></div>`);
        }
        hidden = [];
      };
      this._lines.forEach((line, i) => {
        if (!this._shows(line, i)) return hidden.push(i);
        foldHidden();
        rows.push(lineHtml(i));
      });
      foldHidden();
      return rows.join('');
    }

    // A line shows when nothing is folded, when it's in or around a spotlit path, or when opened.
    _shows(line, i) {
      if (this.expanded || !this._spotlight.length || this._opened.has(i)) return true;
      return this._spotlight.some((path) => within(line.path, path) || within(path, line.path));
    }

    // Marks what is spotlit, selected, pointed at and noted, without redrawing, so focus stays put.
    _showState() {
      if (!this._lines.length) return;
      const inAny = (path, list) => list.some((outer) => within(path, outer));
      const pointed = this._highlight.filter((path) => this._values.has(path));
      for (const row of this.querySelectorAll('.sb-json__line')) {
        const path = row.dataset.path;
        const line = this._lines[row.dataset.index];
        row.classList.toggle('sb-json__line--spotlit', inAny(path, this._spotlight));
        row.classList.toggle('sb-json__line--selected', this._selected != null && within(path, this._selected));
        row.classList.toggle('sb-json__line--hovered', this._hovered != null && within(path, this._hovered));
        row.classList.toggle('sb-json__line--highlighted', inAny(path, pointed));
        row.classList.toggle('sb-json__line--noted', line.starts && this._notes[path] != null);
        if (this._notes[path] != null) row.setAttribute('aria-describedby', this._noteId);
        else row.removeAttribute('aria-describedby');
        row.setAttribute('aria-selected', String(path === this._selected));
      }
      for (const gap of this.querySelectorAll('.sb-json__gap')) {
        const hides = this._lines.slice(Number(gap.dataset.from), Number(gap.dataset.to) + 1);
        gap.classList.toggle('sb-json__gap--holds-highlight', hides.some((line) => pointed.some((path) => within(line.path, path))));
      }
      this._showBar();
      this._rove();
    }

    // The bar names the path being pointed at, or else the selected one.
    _showBar() {
      const path = this._hovered ?? this._selected;
      const label = this.querySelector('.sb-json__path');
      label.classList.toggle('sb-json__path--empty', path == null);
      label.textContent = path == null ? 'Click a line to see its path.' : path === '' ? '(the whole document)' : path;
      const toggle = this.querySelector('.sb-json__toggle');
      toggle.hidden = !this._spotlight.length;
      toggle.textContent = this.expanded ? 'Fold the rest' : `Show all ${this._lines.length} lines`;
      toggle.setAttribute('aria-pressed', String(this.expanded));
    }

    // A line's note, in a card just above it, or below when there's no room. The card sits in the
    // top layer, so nothing in the page moves and no scrolling box clips it.
    _showNote(row) {
      const card = this.querySelector('.sb-json__note');
      const note = row ? this._notes[row.dataset.path] : null;
      if (!card || row === this._noteRow) return;
      this._noteRow = note == null ? null : row;
      if (note == null) {
        if (card.matches(':popover-open')) card.hidePopover();
        return;
      }
      card.textContent = note;
      card.showPopover();
      const start = (row.querySelector('.sb-json__text > span') ?? row).getBoundingClientRect();
      const above = start.top - NOTE_GAP - card.offsetHeight;
      const left = Math.min(start.left, innerWidth - card.offsetWidth - VIEWPORT_MARGIN);
      card.style.left = `${Math.max(VIEWPORT_MARGIN, left)}px`;
      card.style.top = `${above >= VIEWPORT_MARGIN ? above : start.bottom + NOTE_GAP}px`;
    }

    // One row takes Tab: the selected line if shown, else the first row.
    _rove() {
      const rows = this._rows();
      const focusable = this._line(this._selected) ?? rows[0];
      for (const row of rows) row.tabIndex = row === focusable ? 0 : -1;
    }

    _rows() { return [...this.querySelectorAll('.sb-json__line, .sb-json__gap')]; }

    // The line where a path starts.
    _line(path) {
      return path == null ? null : [...this.querySelectorAll('.sb-json__line')].find((row) => row.dataset.path === path);
    }

    // ---- Interaction ----

    _hover(path) {
      if (path === this._hovered) return;
      this._hovered = path;
      this._showState();
    }

    _choose(path) {
      this.selected = path;
      const value = this._values.get(path);
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { path, value, note: this._notes[path] ?? null } }));
    }

    _openGap(gap) {
      const from = Number(gap.dataset.from), to = Number(gap.dataset.to);
      for (let i = from; i <= to; i++) this._opened.add(i);
      this.render();
      this.querySelector(`.sb-json__line[data-index="${from}"]`)?.focus();
    }

    _click(e) {
      if (e.target.closest('.sb-json__toggle')) {
        this.expanded = !this.expanded;
        this.querySelector('.sb-json__toggle').focus();
        this.dispatchEvent(new CustomEvent('sb-toggle', { bubbles: true, detail: { expanded: this.expanded } }));
        return;
      }
      const gap = e.target.closest('.sb-json__gap');
      if (gap) return this._openGap(gap);
      const line = e.target.closest('.sb-json__line');
      if (line) this._choose(line.dataset.path);
    }

    // Up and down move between rows; Enter or Space selects a line or unfolds a gap.
    _key(e) {
      const row = e.target.closest('.sb-json__line, .sb-json__gap');
      if (!row) return;
      const rows = this._rows();
      const at = rows.indexOf(row);
      const act = () => (row.classList.contains('sb-json__gap') ? this._openGap(row) : this._choose(row.dataset.path));
      const actions = {
        ArrowDown: () => rows[at + 1]?.focus(),
        ArrowUp: () => rows[at - 1]?.focus(),
        Home: () => rows[0].focus(),
        End: () => rows.at(-1).focus(),
        Enter: act,
        ' ': act
      };
      if (!actions[e.key]) return;
      e.preventDefault();
      actions[e.key]();
    }
  }

  customElements.define('sb-json', SbJson);
})();
