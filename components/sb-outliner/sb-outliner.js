// Sandkit sb-outliner 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// A floating panel outlining the things on a page that can be pointed at, each opening into its
// parts. Pointing at an entry announces its whole trace, so everything connected lights up across
// the page; two pins per entry, a fill and an outline, keep traces lit while people work, follow
// the model, and can glow.
//
//   <sb-outliner id="highlights"></sb-outliner>
//   outliner.items = [{ ref: 'T3', label: '10:42 Brighton', parts: [{ ref: 'T3.delay', label: 'delay: 4' }] }];
//   outliner.trace = (ref) => model.traceOf(ref);   // what a ref lights, as refs
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-outliner';
  const existing = customElements.get('sb-outliner');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-outliner>, so only one can run. Rename one by replacing every "sb-outliner" in its file.`);
    }
    return;
  }

  const KINDS = ['fill', 'outline'];

  const CSS = `
    .sb-outliner { position: fixed; z-index: 40; top: 72px; right: 16px; display: flex; flex-direction: column; box-sizing: border-box; width: min(290px, calc(100vw - 32px)); max-height: calc(100vh - 96px); border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 13px/1.4 var(--sb-font, system-ui, sans-serif); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22); }
    .sb-outliner__bar { display: flex; flex: none; align-items: center; gap: 6px; padding: 5px 8px 5px 10px; border-bottom: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px) var(--sb-radius, 8px) 0 0; background: var(--sb-surface-2, #eef0f3); cursor: move; touch-action: none; user-select: none; }
    .sb-outliner[hidden] { display: none; }
    .sb-outliner__grip { flex: none; width: 10px; height: 14px; color: var(--sb-muted, #616e7c); background: radial-gradient(circle, currentColor 1.3px, transparent 1.6px) 0 0 / 5px 5px; }
    .sb-outliner__title { flex: 1; overflow: hidden; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
    .sb-outliner__button { padding: 2px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 4px; background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-outliner__button:disabled { opacity: 0.5; cursor: default; }
    .sb-outliner__button[aria-pressed="true"] { border-color: var(--sb-accent, #2563eb); color: var(--sb-accent, #2563eb); }
    .sb-outliner__button:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-outliner__body { overflow-y: auto; padding: 8px 10px 10px; }
    .sb-outliner__hint { margin: 0 0 6px; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-outliner__heading { margin: 8px 0 2px; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .sb-outliner__heading:first-child { margin-top: 0; }
    .sb-outliner__parts > .sb-outliner__heading { margin: 4px 0 1px 26px; font-size: 10px; }
    .sb-outliner__entry { display: flex; align-items: center; gap: 6px; margin-bottom: 1px; padding: 2px 6px 2px 2px; border: 1px solid transparent; border-radius: 4px; }
    .sb-outliner__parts .sb-outliner__entry { margin-left: 20px; }
    .sb-outliner__caret, .sb-outliner__space { flex: none; width: 16px; height: 16px; padding: 0; border: 0; background: none; color: var(--sb-muted, #616e7c); font: 13px/16px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-outliner__label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sb-outliner__pin { flex: none; width: 14px; height: 14px; padding: 0; border-radius: 3px; cursor: pointer; opacity: 0.4; }
    .sb-outliner__pin:hover { opacity: 0.8; }
    .sb-outliner__pin[aria-pressed="true"] { opacity: 1; }
    .sb-outliner__pin--fill { border: 1px solid transparent; background: var(--sb-muted, #616e7c); }
    .sb-outliner__pin--fill[aria-pressed="true"] { background: var(--sb-accent, #2563eb); }
    .sb-outliner__pin--outline { border: 2px solid var(--sb-muted, #616e7c); background: none; }
    .sb-outliner__pin--outline[aria-pressed="true"] { border-color: var(--sb-accent, #2563eb); }
    .sb-outliner__caret:focus-visible, .sb-outliner__pin:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-outliner__entry--lit { border-color: color-mix(in srgb, var(--sb-accent, #2563eb) 35%, transparent); }
    .sb-outliner__entry--pinned-outline { border-color: color-mix(in srgb, var(--sb-accent, #2563eb) calc(var(--sb-glow, 1) * 100%), transparent); }
    .sb-outliner__entry.sb-outliner__entry--pointed { border-color: var(--sb-accent, #2563eb); box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }
    .sb-outliner__entry--pinned-fill { background: color-mix(in srgb, var(--sb-accent, #2563eb) calc(var(--sb-glow, 1) * 28%), transparent); }
    .sb-outliner__empty { margin: 0; color: var(--sb-muted, #616e7c); }

    /* Glow: --sb-glow eases from 1 down to 0.05 and back on whatever carries the glowing class, and
       everything inside inherits it, so all pinned colours made with it fade together. */
    @property --sb-glow { syntax: '<number>'; inherits: true; initial-value: 1; }
    @keyframes sb-outliner-glow { 50% { --sb-glow: 0.05; } }
    .sb-outliner__glowing { animation: sb-outliner-glow 3s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .sb-outliner__glowing { animation: none; } }`;

  const announce = (detail) => document.dispatchEvent(new CustomEvent('sb-highlight', { detail }));

  function addStyle() {
    if (document.getElementById('sb-outliner-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-outliner-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Browser storage, which may be refused: then nothing is remembered.
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* this visit only */ } },
  };

  const entriesOf = (list) => (list ?? []).filter((entry) => entry.ref != null);
  const element = (tag, className, text) => Object.assign(document.createElement(tag), { className, textContent: text ?? '' });

  class SbOutliner extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['heading'];

    constructor() {
      super();
      this._items = [];
      this._open = new Set();
      this._pins = { fill: new Set(), outline: new Set() };
      this._traced = { fill: new Set(), outline: new Set() }; // what the pins light, worked out from trace
      this._pointed = null;                                   // the ref announced now, by anyone
      this._lit = new Set();                                  // and its trace
      this._glow = false;
      this._shown = true;
      this.trace = (ref) => [ref];
      this._onHighlight = (e) => {
        const { ref, refs } = e.detail ?? {};
        this._pointed = ref ?? null;
        this._lit = new Set(refs ?? (ref == null ? [] : [ref]));
        this._paintMarks();
      };
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-outliner');
      document.addEventListener('sb-highlight', this._onHighlight);
      if (this._built) return;
      this._built = true;
      this._restore();
      this._frame();
      this._render();
      this.addEventListener('click', (e) => this._onClick(e));
      this.addEventListener('pointerover', (e) => this._arrive(e));
      this.addEventListener('focusin', (e) => this._arrive(e));
      this.addEventListener('pointerout', (e) => this._leave(e));
      this.addEventListener('focusout', (e) => this._leave(e));
    }

    disconnectedCallback() {
      document.removeEventListener('sb-highlight', this._onHighlight);
    }

    attributeChangedCallback() {
      if (this._built) this.querySelector('.sb-outliner__title').textContent = this.heading;
    }

    // ---- Public API ----

    // The name in the panel's bar.
    get heading() { return this.getAttribute('heading') || 'Highlights'; }
    set heading(text) { this.setAttribute('heading', text); }

    // The outline: [{ ref, label, parts? } or { heading }], parts the same shape, one level deep.
    // Setting it redraws, keeps pins and open items, drops pins on refs that are gone, and sends sb-pins.
    get items() { return this._items; }
    set items(items) {
      this._items = Array.isArray(items) ? items : [];
      const known = new Set(entriesOf(this._items).flatMap((item) => [item.ref, ...entriesOf(item.parts).map((part) => part.ref)]));
      for (const kind of KINDS) for (const ref of this._pins[kind]) if (!known.has(ref)) this._pins[kind].delete(ref);
      this._save();
      if (this._built) this._render();
      this.refresh();
    }

    // The refs pinned, by kind. Setting them sends sb-pins, and no sb-pin.
    get pins() { return { fill: [...this._pins.fill], outline: [...this._pins.outline] }; }
    set pins(pins) {
      for (const kind of KINDS) this._pins[kind] = new Set(pins?.[kind] ?? []);
      this._save();
      this.refresh();
    }

    // Whether the panel is open. The shell's header button sets it; setting it fires nothing.
    get open() { return this._shown; }
    set open(on) {
      this._shown = Boolean(on);
      this.hidden = !this._shown;
      this._save();
    }

    // Whether pinned highlights glow. Viewers switch it with Glow; setting it sends sb-pins.
    get glow() { return this._glow; }
    set glow(on) {
      this._glow = Boolean(on);
      this._save();
      this.refresh();
    }

    // Works out every pinned trace again and sends it, with whether pins glow, as sb-pins.
    refresh() {
      for (const kind of KINDS) this._traced[kind] = new Set([...this._pins[kind]].flatMap((ref) => this.trace(ref) ?? [ref]));
      this.classList.toggle('sb-outliner__glowing', this._glow);
      this._paintMarks();
      const detail = { fill: [...this._traced.fill], outline: [...this._traced.outline], glow: this._glow };
      this.dispatchEvent(new CustomEvent('sb-pins', { bubbles: true, detail }));
    }

    // Opens the item holding `place`, or else the item with a part marked ref, and the panel.
    // Quiet, and not remembered as the viewer's choice. False if no item holds it.
    reveal(ref, place) {
      const item = place
        ? entriesOf(this._items).find((it) => this.querySelector(`.sb-outliner__entry[data-ref="${it.ref}"]`)?.contains(place))
        : entriesOf(this._items).find((it) => it.ref === ref || entriesOf(it.parts).some((part) => part.ref === ref));
      if (!item) return false;
      this.hidden = false;
      this._shown = true;
      if (Array.isArray(item.parts) && !this._open.has(item.ref) && item.ref !== ref) {
        this._open.add(item.ref);
        this._render();
      }
      return true;
    }

    // ---- Remembering, with an id ----

    _restore() {
      const saved = this.id ? store.get(`sb-outliner:${this.id}`) : null;
      if (!saved) return;
      this._open = new Set(saved.items ?? []);
      for (const kind of KINDS) if (!this._pins[kind].size) this._pins[kind] = new Set(saved.pins?.[kind] ?? []);
      this._glow = Boolean(saved.glow);
      this._shown = saved.open !== false;
    }

    _save() {
      if (this.id && this._built) store.set(`sb-outliner:${this.id}`, { items: [...this._open], pins: this.pins, glow: this._glow, open: this._shown });
    }

    // ---- Drawing ----

    // The panel: a bar to drag it by, with its heading and buttons, over the outline.
    _frame() {
      const bar = element('div', 'sb-outliner__bar');
      bar.title = 'Drag to move';
      bar.append(element('span', 'sb-outliner__grip'), element('span', 'sb-outliner__title', this.heading));
      for (const [action, text, title] of [['glow', 'Glow', 'Pinned highlights fade gently in and out'], ['unpin', 'Unpin all', 'Unpin everything'], ['close', '✕', 'Close']]) {
        const button = element('button', 'sb-outliner__button', text);
        Object.assign(button, { type: 'button', title });
        button.dataset.action = action;
        bar.append(button);
      }
      this._body = element('div', 'sb-outliner__body');
      this.replaceChildren(bar, this._body);
      this.querySelector('[data-action="close"]').setAttribute('aria-label', `Close ${this.heading}`);
      this._draggable(bar);
      this.hidden = !this._shown;
    }

    _render() {
      const focused = document.activeElement?.closest?.('.sb-outliner__entry')?.dataset.ref;
      const list = element('div', 'sb-outliner__list');
      for (const item of this._items) list.append(...this._draw(item, true));
      if (!this._items.length) list.append(element('p', 'sb-outliner__empty', 'Nothing to list yet.'));
      this._body.replaceChildren(element('p', 'sb-outliner__hint', 'Point to light up · pin to keep'), list);
      if (focused) this.querySelector(`.sb-outliner__entry[data-ref="${focused}"] button`)?.focus();
      this._paintMarks();
    }

    // An item, or a part, as an entry: its caret if it has parts, its label and its two pins.
    _draw(entry, isItem) {
      if (entry.ref == null) return [element('div', 'sb-outliner__heading', entry.heading)];
      const row = element('div', 'sb-outliner__entry');
      row.dataset.ref = entry.ref;
      const hasParts = isItem && Array.isArray(entry.parts);
      const isOpen = hasParts && this._open.has(entry.ref);
      if (hasParts) {
        const caret = element('button', 'sb-outliner__caret', isOpen ? '▾' : '▸');
        Object.assign(caret, { type: 'button', title: isOpen ? 'Close' : 'Open' });
        caret.setAttribute('aria-expanded', String(isOpen));
        row.append(caret);
      } else if (isItem) {
        row.append(element('span', 'sb-outliner__space'));
      }
      row.append(element('span', 'sb-outliner__label', entry.label ?? entry.ref));
      for (const kind of KINDS) {
        const pin = element('button', `sb-outliner__pin sb-outliner__pin--${kind}`);
        pin.type = 'button';
        pin.dataset.kind = kind;
        pin.setAttribute('aria-label', `Keep ${entry.label ?? entry.ref} ${kind === 'fill' ? 'filled' : 'outlined'}`);
        pin.title = `Keep lit, ${kind === 'fill' ? 'filled' : 'outlined'}`;
        row.append(pin);
      }
      if (!isOpen) return [row];
      const parts = element('div', 'sb-outliner__parts');
      for (const part of entry.parts) parts.append(...this._draw(part, false));
      return [row, parts];
    }

    // Marks the entry pointed at strongly and the rest of its trace faintly, and each entry pinned;
    // a closed item is marked for any of its parts.
    _paintMarks() {
      if (!this._built) return;
      const partsOf = new Map(entriesOf(this._items).map((item) => [item.ref, entriesOf(item.parts).map((part) => part.ref)]));
      for (const row of this.querySelectorAll('.sb-outliner__entry')) {
        const ref = row.dataset.ref;
        const hidden = this._open.has(ref) ? [] : partsOf.get(ref) ?? [];
        const marked = (set) => set.has(ref) || hidden.some((part) => set.has(part));
        row.classList.toggle('sb-outliner__entry--pointed', marked(new Set([this._pointed])));
        row.classList.toggle('sb-outliner__entry--lit', marked(this._lit));
        for (const kind of KINDS) {
          row.classList.toggle(`sb-outliner__entry--pinned-${kind}`, marked(this._traced[kind]));
          row.querySelector(`.sb-outliner__pin--${kind}`).setAttribute('aria-pressed', String(this._pins[kind].has(ref)));
        }
      }
      this.querySelector('[data-action="unpin"]').disabled = !this._pins.fill.size && !this._pins.outline.size;
      this.querySelector('[data-action="glow"]').setAttribute('aria-pressed', String(this._glow));
    }

    // The panel moves by its bar, so it never has to cover what people are working on. It stays
    // where it's dropped, kept within the window.
    _draggable(bar) {
      bar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        const box = this.getBoundingClientRect();
        const offset = { x: e.clientX - box.left, y: e.clientY - box.top };
        const move = (m) => {
          const left = Math.min(Math.max(0, m.clientX - offset.x), innerWidth - box.width);
          const top = Math.min(Math.max(0, m.clientY - offset.y), innerHeight - 40);
          Object.assign(this.style, { left: `${left}px`, top: `${top}px`, right: 'auto', bottom: 'auto' });
        };
        const drop = () => {
          bar.removeEventListener('pointermove', move);
          bar.removeEventListener('pointerup', drop);
          bar.removeEventListener('pointercancel', drop);
        };
        bar.setPointerCapture(e.pointerId);
        bar.addEventListener('pointermove', move);
        bar.addEventListener('pointerup', drop);
        bar.addEventListener('pointercancel', drop);
      });
    }

    // ---- What viewers do ----

    _onClick(e) {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'unpin') return this._unpinAll();
      if (action === 'glow') return (this.glow = !this._glow);
      if (action === 'close') return this._close();
      const row = e.target.closest('.sb-outliner__entry');
      if (!row) return;
      if (e.target.closest('.sb-outliner__caret')) return this._toggle(row.dataset.ref);
      const pin = e.target.closest('.sb-outliner__pin');
      if (pin) this._pin(row.dataset.ref, pin.dataset.kind);
    }

    // The viewer closed the panel: the shell's header button follows sb-open, and opens it again.
    _close() {
      this.open = false;
      this.dispatchEvent(new CustomEvent('sb-open', { bubbles: true, detail: { panel: this.heading, open: false } }));
    }

    _toggle(ref) {
      if (!this._open.delete(ref)) this._open.add(ref);
      this._save();
      this._render();
    }

    _pin(ref, kind) {
      const pinned = !this._pins[kind].delete(ref);
      if (pinned) this._pins[kind].add(ref);
      this._save();
      this.refresh();
      this._fire(ref, kind, pinned);
    }

    _unpinAll() {
      const was = this.pins;
      for (const kind of KINDS) this._pins[kind].clear();
      this._save();
      this.refresh();
      for (const kind of KINDS) for (const ref of was[kind]) this._fire(ref, kind, false);
    }

    _fire(ref, kind, pinned) {
      this.dispatchEvent(new CustomEvent('sb-pin', { bubbles: true, detail: { ref, kind, pinned } }));
    }

    // Arriving at an entry announces its trace; leaving ends it, unless it went straight to another entry.
    _arrive(e) {
      const row = e.target.closest?.('.sb-outliner__entry');
      if (row && row !== e.relatedTarget?.closest?.('.sb-outliner__entry')) announce({ ref: row.dataset.ref, refs: this.trace(row.dataset.ref) ?? [row.dataset.ref] });
    }

    _leave(e) {
      const row = e.target.closest?.('.sb-outliner__entry');
      if (row && !e.relatedTarget?.closest?.('.sb-outliner__entry')) announce({ ref: null });
    }
  }

  customElements.define('sb-outliner', SbOutliner);
})();
