// Sandkit sb-walkthrough 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// A story told across several views, one step at a time. Children marked data-step are the
// narration, shown one at a time with Back and Next; children with a slot are the views, laid out
// beside it. Each step names the views to look at (data-focus), which are outlined, and the refs to
// highlight (data-highlight), which the sandbox passes on to the components inside them.
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

  const CSS = `
    .sb-walkthrough { display: grid; gap: 12px; height: 640px; grid-template: minmax(0, 1fr) / var(--sb-walkthrough-width, 320px) minmax(0, 1fr); color: var(--sb-text, #1f2933); }
    .sb-walkthrough[narration="bottom"] { grid-template: minmax(0, 1fr) auto / minmax(0, 1fr); }
    .sb-walkthrough[narration="bottom"] .sb-walkthrough__narration { order: 1; max-height: var(--sb-walkthrough-height, 240px); }

    .sb-walkthrough__narration { display: flex; flex-direction: column; min-height: 0; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); }
    .sb-walkthrough__steps { flex: 1; min-height: 0; overflow: auto; padding: 14px 16px; font-size: 14px; line-height: 1.55; }
    .sb-walkthrough__steps > [data-step][hidden] { display: none !important; }
    .sb-walkthrough__steps [data-ref] { border-bottom: 1px dashed var(--sb-accent, #2563eb); cursor: default; }
    .sb-walkthrough__controls { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-top: 1px solid var(--sb-border, #d5d9e0); }
    .sb-walkthrough__count { flex: 1; text-align: center; color: var(--sb-muted, #616e7c); font-size: 12px; font-variant-numeric: tabular-nums; }
    .sb-walkthrough__button { padding: 5px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: inherit; font-size: 13px; cursor: pointer; }
    .sb-walkthrough__button--next { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #ffffff); }
    .sb-walkthrough__button:disabled { opacity: 0.4; cursor: default; }

    .sb-walkthrough__views { display: grid; gap: 12px; min-width: 0; min-height: 0; grid-template: minmax(0, 1fr) / minmax(0, 1fr); }
    .sb-walkthrough__views[data-count="2"] { grid-template: repeat(2, minmax(0, 1fr)) / minmax(0, 1fr); }
    .sb-walkthrough[narration="bottom"] .sb-walkthrough__views[data-count="2"] { grid-template: minmax(0, 1fr) / repeat(2, minmax(0, 1fr)); }
    .sb-walkthrough__views:is([data-count="3"], [data-count="4"]) { grid-template: repeat(2, minmax(0, 1fr)) / repeat(2, minmax(0, 1fr)); }
    .sb-walkthrough__views[data-count="3"] > :first-child { grid-row: span 2; }
    /* Each view is framed like the narration, so it's clear where one ends and the next begins. The
       padding leaves room for a focused view's outline. */
    .sb-walkthrough__view { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); }
    .sb-walkthrough__view > * { flex: 1; min-height: 0; overflow: auto; }
    .sb-walkthrough .sb-walkthrough--focused { outline: 3px solid var(--sb-accent, #2563eb); outline-offset: 3px; }`;

  function addStyle() {
    if (document.getElementById('sb-walkthrough-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-walkthrough-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  const words = (value) => (value ?? '').split(/\s+/).filter(Boolean);

  class SbWalkthrough extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._step = 0;
      this._pointed = null;
      // Steps and views added later are put in their places too.
      this._observer = new MutationObserver(() => this._place());
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
      return this._built ? [...this._viewList.children].map((cell) => cell.querySelector(':scope > [slot]')) : [...this.children].filter((c) => c.hasAttribute('slot'));
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
      this.append(this._narration, this._viewList);
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
      this._viewList.dataset.count = this._viewList.children.length;
      this._step = this._clamp(this._step);
      this._show();
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
