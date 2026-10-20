// Sandkit sb-tour 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// A guided tour of the page as it stands: a tooltip beside one thing at a time, with the rest of
// the page dimmed, and Next moving on. Steps are HTML children naming what they point at; the
// sandbox goes there and hands the tour the element, so the tour never searches the page.
//
//   <sb-tour id="basics" heading="How this sandbox works">
//     <div data-step data-at="controls">These run the model.</div>
//   </sb-tour>
//   tour.addEventListener('sb-step', (e) => { tour.anchor = e.detail.ref ? goTo(e.detail.ref) || null : null; });
//   tour.start();
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-tour';
  const existing = customElements.get('sb-tour');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-tour>, so only one can run. Rename one by replacing every "sb-tour" in its file.`);
    }
    return;
  }

  // The spotlight and the tooltip sit in the browser's top layer (the popover API), above
  // everything on the page, floating panels included. The dimming only dims: clicks pass through,
  // so the part pointed at, and the rest of the page, stay usable.
  const CSS = `
    .sb-tour { display: contents; }
    .sb-tour__spotlight { position: fixed; inset: auto; margin: 0; padding: 0; border: 0; border-radius: var(--sb-radius, 8px); background: transparent; pointer-events: none; box-shadow: 0 0 0 200vmax var(--sb-tour-dim, rgba(0, 0, 0, 0.45)); transition: left 0.2s, top 0.2s, width 0.2s, height 0.2s; }
    .sb-tour__spotlight--anchored { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 2px; }
    .sb-tour__tip { position: fixed; inset: auto; margin: 0; width: min(340px, calc(100vw - 24px)); padding: 12px 14px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 14px/1.5 var(--sb-font, system-ui, sans-serif); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); }
    .sb-tour__tip:focus { outline: none; }
    .sb-tour__heading { margin-bottom: 4px; color: var(--sb-muted, #616e7c); font-size: 12px; font-weight: 600; }
    .sb-tour__steps > [data-step][hidden] { display: none !important; }
    .sb-tour__missing { margin-top: 6px; color: var(--sb-warn, #d69e2e); font-size: 12px; }
    .sb-tour__controls { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
    .sb-tour__count { flex: 1; color: var(--sb-muted, #616e7c); font-size: 12px; font-variant-numeric: tabular-nums; }
    .sb-tour__button { padding: 4px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: inherit; font-size: 13px; cursor: pointer; }
    .sb-tour__button--next { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #ffffff); }
    .sb-tour__button:disabled { opacity: 0.4; cursor: default; }
    .sb-tour__button:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-tour__close { margin-left: 2px; padding: 0 6px; border: 0; background: none; color: var(--sb-muted, #616e7c); font-size: 18px; line-height: 1; cursor: pointer; }`;

  const GAP = 10;      // between the part pointed at and the tooltip
  const MARGIN = 12;   // the least room kept between the tooltip and the window's edge
  const PADDING = 6;   // around the part, inside the spotlight

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp = (value, low, high) => Math.min(Math.max(value, low), Math.max(low, high));

  function addStyle() {
    if (document.getElementById('sb-tour-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-tour-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Tours with an id remember whether each viewer has finished them.
  const storage = {
    read(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    write(key, value) {
      try { localStorage.setItem(key, value); } catch { /* kept for this visit only */ }
    }
  };

  // A step's part is scrolled to only when it isn't already in full view, so a part the viewer
  // is working with stays put. A part taller than the window shows from its top.
  function bringIntoView(part) {
    const box = part.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= innerHeight) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    part.scrollIntoView({ block: box.height > innerHeight ? 'start' : 'center', behavior: still ? 'auto' : 'smooth' });
  }

  let instanceCount = 0; // gives each tour unique ids for its tooltip's labels

  class SbTour extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['heading'];

    constructor() {
      super();
      this._id = `sb-tour-${++instanceCount}`;
      this._index = -1; // the step showing, or -1 while closed
      this._anchor = null;
      this._ready = false;
      this._returnFocus = null;
      this._frame = 0;
      this._follow = () => {
        this._place();
        this._frame = requestAnimationFrame(this._follow);
      };
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-tour');
      if (this._built) return;
      // Steps are children, so wait until they have been parsed.
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      else this._build();
    }

    disconnectedCallback() {
      this._unfollow();
    }

    attributeChangedCallback() {
      if (this._built) this._tip.querySelector('.sb-tour__heading').textContent = this.getAttribute('heading') ?? '';
    }

    // ---- Public API ----

    // The steps, in order.
    get steps() {
      return this._built ? [...this._stepList.children] : [...this.children].filter((c) => c.hasAttribute('data-step'));
    }

    get open() { return this._index !== -1; }

    // { index, ref, element } for the step showing, or null while closed.
    get current() {
      if (!this.open) return null;
      const element = this.steps[this._index];
      return { index: this._index, ref: element.dataset.at ?? null, element };
    }

    // The element the step points at, handed over by the sandbox, or null.
    get anchor() { return this._anchor; }
    set anchor(element) {
      this._anchor = element || null;
      if (this._anchor && this._toBringIntoView) bringIntoView(this._anchor);
      this._toBringIntoView = false;
      this._showStep();
    }

    // For a step marked data-wait: true lets the viewer move on. Every step starts not ready.
    get ready() { return this._ready; }
    set ready(value) {
      this._ready = Boolean(value);
      this._showControls();
    }

    // Whether this viewer has finished the tour before. Needs an id.
    get seen() { return Boolean(this.id) && storage.read(`sb-tour:${this.id}`) === 'seen'; }

    start(index = 0) {
      if (!this._built) this._build();
      this._gather();
      if (!this.steps.length) return;
      if (!this.open) {
        this._returnFocus = document.activeElement;
        this._spotlight.showPopover();
        this._tip.showPopover();
        this._follow();
      }
      this._go(clamp(index, 0, this.steps.length - 1));
    }

    next() {
      if (!this.open || this._waiting) return;
      if (this._index === this.steps.length - 1) this._finish('done');
      else this._go(this._index + 1);
    }

    back() {
      if (this.open && this._index > 0) this._go(this._index - 1);
    }

    close() {
      if (this.open) this._finish('close');
    }

    // ---- Building ----

    _build() {
      if (this._built) return; // moved while the page loads, it is asked twice
      this._built = true;
      this._spotlight = Object.assign(document.createElement('div'), { className: 'sb-tour__spotlight' });
      this._spotlight.popover = 'manual';
      this._tip = Object.assign(document.createElement('div'), { className: 'sb-tour__tip', tabIndex: -1 });
      this._tip.popover = 'manual';
      this._tip.setAttribute('role', 'dialog');
      this._tip.setAttribute('aria-labelledby', `${this._id}-heading`);
      this._tip.innerHTML = `
        <div class="sb-tour__heading" id="${this._id}-heading">${esc(this.getAttribute('heading'))}</div>
        <div class="sb-tour__steps" aria-live="polite"></div>
        <div class="sb-tour__missing" hidden></div>
        <div class="sb-tour__controls">
          <span class="sb-tour__count"></span>
          <button type="button" class="sb-tour__button" data-move="back">Back</button>
          <button type="button" class="sb-tour__button sb-tour__button--next" data-move="next">Next</button>
          <button type="button" class="sb-tour__close" data-move="close" aria-label="Close the tour">×</button>
        </div>`;
      this._stepList = this._tip.querySelector('.sb-tour__steps');
      this._tip.addEventListener('click', (e) => {
        const move = e.target.closest('[data-move]')?.dataset.move;
        if (move) this[move]();
      });
      this._tip.addEventListener('keydown', (e) => this._key(e));
      this.append(this._spotlight, this._tip);
      this._gather();
    }

    // Steps written as children, now or since the last time, join the tooltip in order.
    _gather() {
      for (const step of [...this.children].filter((c) => c.hasAttribute('data-step'))) this._stepList.append(step);
    }

    // ---- Steps ----

    _go(index) {
      this._index = index;
      this._anchor = null;
      this._ready = false;
      this._toBringIntoView = true;
      this._showStep();
      const { ref, element } = this.current;
      this.dispatchEvent(new CustomEvent('sb-step', { bubbles: true, detail: { index, ref, element } }));
      this._tip.focus({ preventScroll: true });
    }

    // A step marked data-wait holds Next until the sandbox says the viewer has done what it asks.
    get _waiting() {
      return this.open && this.steps[this._index].hasAttribute('data-wait') && !this._ready;
    }

    _finish(reason) {
      const index = this._index;
      this._index = -1;
      this._anchor = null;
      this._unfollow();
      this._tip.hidePopover();
      this._spotlight.hidePopover();
      if (reason === 'done' && this.id) storage.write(`sb-tour:${this.id}`, 'seen');
      this._returnFocus?.focus?.({ preventScroll: true });
      this.dispatchEvent(new CustomEvent('sb-close', { bubbles: true, detail: { index, reason } }));
    }

    // Placed again on every frame while open, so the spotlight keeps to the part however it moves:
    // scrolling, resizing, or the part itself changing as the viewer works with it.
    _unfollow() {
      cancelAnimationFrame(this._frame);
    }

    // The current step's text, a note if what it points at can't be found, and the controls.
    _showStep() {
      if (!this.open) return;
      this.steps.forEach((step, i) => { step.hidden = i !== this._index; });
      const ref = this.current.ref;
      const missing = this._tip.querySelector('.sb-tour__missing');
      missing.hidden = !(ref && !this._anchor);
      missing.textContent = ref ? `Can’t find ${ref} on this page.` : '';
      this._showControls();
      this._place();
    }

    _showControls() {
      if (!this.open) return;
      const last = this._index === this.steps.length - 1;
      this._tip.querySelector('.sb-tour__count').textContent = `${this._index + 1} of ${this.steps.length}`;
      this._tip.querySelector('[data-move="back"]').disabled = this._index === 0;
      const next = this._tip.querySelector('[data-move="next"]');
      next.textContent = last ? 'Done' : 'Next';
      next.disabled = this._waiting;
    }

    // ---- Placing ----

    // The spotlight around the part, the tooltip below it, or above if there's no room, kept on
    // screen. Without a part, both sit in the middle of the window.
    _place() {
      if (!this.open) return;
      const tip = this._tip.getBoundingClientRect();
      if (!this._anchor) {
        Object.assign(this._spotlight.style, { left: `${innerWidth / 2}px`, top: `${innerHeight / 2}px`, width: '0px', height: '0px' });
        this._spotlight.classList.remove('sb-tour__spotlight--anchored');
        Object.assign(this._tip.style, { left: `${(innerWidth - tip.width) / 2}px`, top: `${(innerHeight - tip.height) / 2}px` });
        return;
      }
      const part = this._anchor.getBoundingClientRect();
      Object.assign(this._spotlight.style, {
        left: `${part.left - PADDING}px`, top: `${part.top - PADDING}px`,
        width: `${part.width + 2 * PADDING}px`, height: `${part.height + 2 * PADDING}px`
      });
      this._spotlight.classList.add('sb-tour__spotlight--anchored');
      const below = part.bottom + PADDING + GAP;
      const fitsBelow = below + tip.height <= innerHeight - MARGIN;
      const top = fitsBelow ? below : part.top - PADDING - GAP - tip.height;
      const left = part.left + part.width / 2 - tip.width / 2;
      Object.assign(this._tip.style, {
        left: `${clamp(left, MARGIN, innerWidth - tip.width - MARGIN)}px`,
        top: `${clamp(top, MARGIN, innerHeight - tip.height - MARGIN)}px`
      });
    }

    // ---- Keyboard ----

    // Arrow keys move, Escape closes, and Enter moves on unless it's pressing a button.
    _key(e) {
      const actions = {
        ArrowRight: () => this.next(),
        ArrowLeft: () => this.back(),
        Escape: () => this._finish('escape'),
        Enter: () => this.next()
      };
      if (!actions[e.key] || (e.key === 'Enter' && e.target.closest('button'))) return;
      e.preventDefault();
      actions[e.key]();
    }
  }

  customElements.define('sb-tour', SbTour);
})();
