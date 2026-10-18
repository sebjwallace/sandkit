// Sandkit sb-walkthrough 0.1.3 · MIT Licence · https://github.com/sebjwallace/sandkit
// A story told across several views, one step at a time. Children marked data-step are the
// narration, shown one at a time with Back and Next; children with a slot are the views, laid out
// beside it. Each step names the views to look at (data-focus), which are outlined, and the refs to
// highlight (data-highlight), which the sandbox passes on to the components inside them. Viewers
// drag the dividers between the narration and the views, and between views, to resize them.
//
//   <sb-walkthrough>
//     <section data-step data-focus="screen" data-highlight="checkout">The shopper presses…</section>
//     <div slot="screen">…</div>
//   </sb-walkthrough>
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-walkthrough';
  const existing = customElements.get('sb-walkthrough');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-walkthrough>, so only one can run. Rename one by replacing every "sb-walkthrough" in its file.`);
    }
    return;
  }

  const GAP = 12; // between areas, where the dividers sit
  const MIN_AREA = 120; // the least an area can be dragged down to, in pixels
  const KEY_STEP = 24; // how far an arrow key moves a divider, in pixels

  const CSS = `
    .sb-walkthrough { display: grid; height: 640px; grid-template: minmax(0, 1fr) / var(--sb-walkthrough-width, 320px) ${GAP}px minmax(0, 1fr); color: var(--sb-text, #1f2933); }
    .sb-walkthrough[narration="bottom"] { grid-template: minmax(0, 1fr) ${GAP}px auto / minmax(0, 1fr); }
    .sb-walkthrough[narration="bottom"] .sb-walkthrough__narration { order: 2; max-height: var(--sb-walkthrough-height, 240px); }
    .sb-walkthrough[narration="bottom"] > .sb-walkthrough__divider { order: 1; }

    .sb-walkthrough__narration { display: flex; flex-direction: column; min-height: 0; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); }
    .sb-walkthrough__steps { flex: 1; min-height: 0; overflow: auto; padding: 14px 16px; font-size: 14px; line-height: 1.55; }
    .sb-walkthrough__steps > [data-step][hidden] { display: none !important; }
    .sb-walkthrough__steps [data-ref] { border-bottom: 1px dashed var(--sb-accent, #2563eb); cursor: default; }
    .sb-walkthrough__controls { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-top: 1px solid var(--sb-border, #d5d9e0); }
    .sb-walkthrough__count { flex: 1; text-align: center; color: var(--sb-muted, #616e7c); font-size: 12px; font-variant-numeric: tabular-nums; }
    .sb-walkthrough__button { padding: 5px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: inherit; font-size: 13px; cursor: pointer; }
    .sb-walkthrough__button--next { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #ffffff); }
    .sb-walkthrough__button:disabled { opacity: 0.4; cursor: default; }

    .sb-walkthrough__views { display: grid; min-width: 0; min-height: 0; }
    /* Each view is framed like the narration, so it's clear where one ends and the next begins. The
       padding leaves room for a focused view's outline. */
    .sb-walkthrough__view { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); }
    .sb-walkthrough__view > * { flex: 1; min-height: 0; overflow: auto; }
    .sb-walkthrough .sb-walkthrough--focused { outline: 3px solid var(--sb-accent, #2563eb); outline-offset: 3px; }

    /* Dividers fill the gaps between areas, showing a line while pointed at, focused or dragged. */
    .sb-walkthrough__divider { position: relative; touch-action: none; outline: none; }
    .sb-walkthrough__divider[hidden] { display: none; }
    .sb-walkthrough__divider[aria-orientation="vertical"] { cursor: col-resize; }
    .sb-walkthrough__divider[aria-orientation="horizontal"] { cursor: row-resize; }
    .sb-walkthrough__divider::after { content: ""; position: absolute; inset: 0; margin: auto; border-radius: 2px; }
    .sb-walkthrough__divider[aria-orientation="vertical"]::after { width: 3px; }
    .sb-walkthrough__divider[aria-orientation="horizontal"]::after { height: 3px; }
    .sb-walkthrough__divider:is(:hover, :focus-visible, [data-dragging])::after { background: var(--sb-accent, #2563eb); }`;

  function addStyle() {
    if (document.getElementById('sb-walkthrough-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-walkthrough-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  const words = (value) => (value ?? '').split(/\s+/).filter(Boolean);

  // Two tracks sharing an axis with a divider between them, the first taking `share` of the room;
  // or one track filling it.
  const tracks = (count, share) =>
    count === 2 ? `minmax(0, ${share}fr) ${GAP}px minmax(0, ${1 - share}fr)` : 'minmax(0, 1fr)';

  const clamp = (value, least, most) => Math.min(Math.max(value, least), Math.max(least, most));

  // Where each view sits, as [column, row] grid lines, in a grid whose even tracks are dividers.
  function viewPlaces(count, columns) {
    if (count === 3) return [['1', '1 / -1'], ['3', '1'], ['3', '3']];
    return Array.from({ length: count }, (_, i) => [String((i % columns) * 2 + 1), String(Math.floor(i / columns) * 2 + 1)]);
  }

  function divider(axis, label) {
    const el = document.createElement('div');
    Object.assign(el, { className: 'sb-walkthrough__divider', tabIndex: 0, title: 'Drag to resize; double-click to reset' });
    el.dataset.axis = axis;
    el.setAttribute('role', 'separator');
    el.setAttribute('aria-orientation', axis === 'columns' ? 'vertical' : 'horizontal');
    el.setAttribute('aria-label', label);
    return el;
  }

  class SbWalkthrough extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._step = 0;
      this._pointed = null;
      this._shares = { columns: 0.5, rows: 0.5 }; // the first view column's and row's share of the room
      // Steps and views added later are put in their places too.
      this._observer = new MutationObserver(() => this._place());
    }

    static observedAttributes = ['narration'];

    attributeChangedCallback() {
      if (this._built) this._layOut();
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-walkthrough');
      if (this._built) return;
      // Steps and views are children, so wait until they have been parsed.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      } else {
        this._build();
      }
    }

    // ---- Public API ----

    // The step elements, in order.
    get steps() {
      return this._built ? [...this._stepList.children] : [...this.children].filter((c) => c.hasAttribute('data-step'));
    }

    // The view elements, in order.
    get views() {
      return this._built ? this._cells().map((cell) => cell.querySelector(':scope > [slot]')) : [...this.children].filter((c) => c.hasAttribute('slot'));
    }

    // The index of the step showing. Setting it fires no event: sb-step reports the viewer's moves.
    get step() { return this._step; }
    set step(index) {
      this._step = this._clamp(Number(index));
      this._show();
    }

    // What the step showing asks for: { step, focus, highlight, element }.
    get current() {
      const element = this.steps[this._step] ?? null;
      return { step: this._step, focus: words(element?.dataset.focus), highlight: words(element?.dataset.highlight), element };
    }

    next() { this._go(this._step + 1); }
    previous() { this._go(this._step - 1); }

    // ---- Building ----

    // The narration (steps and controls) and the views each get an area of their own. Each view sits
    // in a cell, so anything it leaves behind when it floats (a placeholder) keeps its place.
    _build() {
      if (this._built) return; // moved while the page loads, it is asked twice
      this._built = true;
      if (this.hasAttribute('step')) this._step = Number(this.getAttribute('step'));
      this._narration = Object.assign(document.createElement('div'), { className: 'sb-walkthrough__narration' });
      this._narration.innerHTML = `
        <div class="sb-walkthrough__steps" aria-live="polite"></div>
        <div class="sb-walkthrough__controls">
          <button type="button" class="sb-walkthrough__button" data-move="-1">‹ Back</button>
          <span class="sb-walkthrough__count"></span>
          <button type="button" class="sb-walkthrough__button sb-walkthrough__button--next" data-move="1">Next ›</button>
        </div>`;
      this._stepList = this._narration.querySelector('.sb-walkthrough__steps');
      this._viewList = Object.assign(document.createElement('div'), { className: 'sb-walkthrough__views' });
      this._dividers = {
        narration: divider('narration', 'Resize the narration'),
        columns: divider('columns', 'Resize the view columns'),
        rows: divider('rows', 'Resize the view rows')
      };
      this._viewList.append(this._dividers.columns, this._dividers.rows);
      for (const el of Object.values(this._dividers)) this._makeDraggable(el);

      this._narration.addEventListener('click', (e) => {
        const move = e.target.closest('[data-move]')?.dataset.move;
        if (move) this._go(this._step + Number(move));
      });
      this._narration.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') this.next();
        if (e.key === 'ArrowLeft') this.previous();
      });
      this._stepList.addEventListener('pointerover', (e) => this._pointAt(e.target.closest('[data-ref]')));
      this._stepList.addEventListener('pointerleave', () => this._pointAt(null));
      this._stepList.addEventListener('focusin', (e) => this._pointAt(e.target.closest('[data-ref]')));
      this._stepList.addEventListener('focusout', () => this._pointAt(null));

      this._place();
      this.append(this._narration, this._dividers.narration, this._viewList);
      this._observer.observe(this, { childList: true });
    }

    // Moves steps into the narration and views into cells; anything else stays where it is.
    _place() {
      for (const child of [...this.children]) {
        if (child.hasAttribute('data-step')) this._stepList.append(child);
        else if (child.hasAttribute('slot')) {
          const cell = Object.assign(document.createElement('div'), { className: 'sb-walkthrough__view' });
          cell.append(child);
          this._viewList.append(cell);
        }
      }
      this._layOut();
      this._step = this._clamp(this._step);
      this._show();
    }

    _cells() {
      return [...this._viewList.querySelectorAll(':scope > .sb-walkthrough__view')];
    }

    // One view fills the room; two stack (or sit side by side, beside bottom narration); three put
    // the first large with two beside it; four make two by two. Every other track is a divider.
    _layOut() {
      const cells = this._cells();
      const count = cells.length;
      const besideEachOther = this.getAttribute('narration') === 'bottom';
      const columns = count > 2 || (count === 2 && besideEachOther) ? 2 : 1;
      const rows = count > 2 || (count === 2 && !besideEachOther) ? 2 : 1;
      this._viewList.dataset.count = count;
      this._viewList.style.gridTemplateColumns = tracks(columns, this._shares.columns);
      this._viewList.style.gridTemplateRows = tracks(rows, this._shares.rows);
      const places = viewPlaces(count, columns);
      cells.forEach((cell, i) => { [cell.style.gridColumn, cell.style.gridRow] = places[i]; });
      Object.assign(this._dividers.columns.style, { gridColumn: '2', gridRow: '1 / -1' });
      Object.assign(this._dividers.rows.style, { gridRow: '2', gridColumn: count === 3 ? '3' : '1 / -1' });
      this._dividers.columns.hidden = columns < 2;
      this._dividers.rows.hidden = rows < 2;
    }

    // ---- Resizing ----

    _makeDraggable(el) {
      const axis = el.dataset.axis;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.dataset.dragging = '';
        try { el.setPointerCapture(e.pointerId); } catch { /* a synthetic pointer can't be captured */ }
      });
      el.addEventListener('pointermove', (e) => {
        if (el.hasAttribute('data-dragging')) this._resize(axis, e.clientX, e.clientY);
      });
      const stop = () => el.removeAttribute('data-dragging');
      el.addEventListener('pointerup', stop);
      el.addEventListener('pointercancel', stop);
      el.addEventListener('dblclick', () => this._resetSize(axis));
      el.addEventListener('keydown', (e) => {
        const move = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
        if (!move) return;
        e.preventDefault();
        const box = el.getBoundingClientRect();
        this._resize(axis, box.left + box.width / 2 + move * KEY_STEP, box.top + box.height / 2 + move * KEY_STEP);
      });
    }

    // Moves a divider to the point (x, y), leaving every area at least MIN_AREA.
    _resize(axis, x, y) {
      if (axis === 'narration') return this._resizeNarration(x, y);
      const box = this._viewList.getBoundingClientRect();
      const across = axis === 'columns';
      const [start, size] = across ? [box.left, box.width] : [box.top, box.height];
      const at = (across ? x : y) - start - GAP / 2;
      const room = size - GAP;
      this._shares[axis] = clamp(at, MIN_AREA, room - MIN_AREA) / room;
      this._layOut();
    }

    // The narration's size is the sandbox's --sb-walkthrough-width or -height, set on the element.
    _resizeNarration(x, y) {
      const box = this.getBoundingClientRect();
      const bottom = this.getAttribute('narration') === 'bottom';
      const size = bottom ? box.bottom - y - GAP / 2 : x - box.left - GAP / 2;
      const room = (bottom ? box.height : box.width) - GAP;
      const name = bottom ? '--sb-walkthrough-height' : '--sb-walkthrough-width';
      this.style.setProperty(name, `${Math.round(clamp(size, MIN_AREA, room - MIN_AREA))}px`);
    }

    _resetSize(axis) {
      if (axis === 'narration') {
        this.style.removeProperty('--sb-walkthrough-width');
        this.style.removeProperty('--sb-walkthrough-height');
      } else {
        this._shares[axis] = 0.5;
        this._layOut();
      }
    }

    // ---- Showing ----

    _show() {
      if (!this._built) return;
      const steps = this.steps;
      steps.forEach((step, i) => { step.hidden = i !== this._step; });
      this._narration.querySelector('.sb-walkthrough__count').textContent = steps.length ? `${this._step + 1} of ${steps.length}` : '';
      this._narration.querySelector('[data-move="-1"]').disabled = this._step === 0;
      this._narration.querySelector('[data-move="1"]').disabled = this._step >= steps.length - 1;
      this._showFocus();
    }

    // Outlines the views the step names, or the view of the word being pointed at.
    _showFocus() {
      const focus = this._pointed?.dataset.focus ? words(this._pointed.dataset.focus) : this.current.focus;
      for (const view of this.views) view.classList.toggle('sb-walkthrough--focused', focus.includes(view.getAttribute('slot')));
    }

    // ---- Interaction ----

    _go(index) {
      const target = this._clamp(index);
      if (target === this._step) return;
      this.step = target;
      this.dispatchEvent(new CustomEvent('sb-step', { bubbles: true, detail: this.current }));
    }

    // Pointing at a word marked data-ref tells the sandbox, and outlines the word's own data-focus.
    _pointAt(word) {
      if (word === this._pointed) return;
      this._pointed = word;
      this._showFocus();
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: { ref: word?.dataset.ref ?? null } }));
    }

    _clamp(index) {
      const last = Math.max(0, this.steps.length - 1);
      return Math.min(last, Math.max(0, Number.isFinite(index) ? index : 0));
    }
  }

  customElements.define('sb-walkthrough', SbWalkthrough);
})();
