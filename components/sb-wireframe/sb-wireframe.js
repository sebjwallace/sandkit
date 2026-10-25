// Sandkit sb-wireframe 0.1.2 · MIT Licence · https://github.com/sebjwallace/sandkit
// A wireframe prototype written in plain HTML. Everything inside is drawn as a wireframe; children
// marked data-screen become screens shown one at a time, data-go moves between them, and parts
// marked data-ref can be pointed at, highlighted and clicked.
//
//   <sb-wireframe>
//     <section data-screen="basket" heading="Basket">
//       <button class="sb-wireframe__primary" data-go="pay" data-ref="checkout">Checkout</button>
//     </section>
//     <section data-screen="pay" heading="Payment">…</section>
//   </sb-wireframe>
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-wireframe';
  const existing = customElements.get('sb-wireframe');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-wireframe>, so only one can run. Rename one by replacing every "sb-wireframe" in its file.`);
    }
    return;
  }

  // The look comes from a few tokens a sandbox can set on the element. :where() keeps the defaults
  // weaker than any rule of the sandbox's, and the content's styles weaker than its classes.
  const CSS = `
    :where(.sb-wireframe) {
      --sb-wireframe-paper: var(--sb-surface, #ffffff);
      --sb-wireframe-ink: var(--sb-text, #1f2933);
      --sb-wireframe-line: var(--sb-muted, #616e7c);
      --sb-wireframe-fill: var(--sb-surface-2, #eef0f3);
      --sb-wireframe-accent: var(--sb-wireframe-ink);
      --sb-wireframe-accent-text: var(--sb-wireframe-paper);
      --sb-wireframe-font: var(--sb-font, system-ui, sans-serif);
    }
    .sb-wireframe { display: block; padding: 16px; border: 2px solid var(--sb-wireframe-line); border-radius: 10px; background: var(--sb-wireframe-paper); color: var(--sb-wireframe-ink); font: 14px/1.45 var(--sb-wireframe-font); }
    .sb-wireframe > [data-screen][hidden] { display: none !important; }

    .sb-wireframe :where(h1, h2, h3, h4) { margin: 0 0 0.5em; line-height: 1.2; }
    .sb-wireframe :where(p) { margin: 0 0 0.6em; }
    .sb-wireframe :where(a) { color: inherit; }
    .sb-wireframe :where(hr) { margin: 12px 0; border: 0; border-top: 2px dashed var(--sb-wireframe-line); }
    .sb-wireframe :where(img) { max-width: 100%; }
    .sb-wireframe :where(button) { padding: 6px 14px; border: 2px solid var(--sb-wireframe-line); border-radius: 6px; background: var(--sb-wireframe-paper); color: var(--sb-wireframe-ink); font: inherit; cursor: pointer; }
    .sb-wireframe :where(input, select, textarea) { box-sizing: border-box; min-width: 0; padding: 6px 8px; border: 2px solid var(--sb-wireframe-line); border-radius: 6px; background: var(--sb-wireframe-fill); color: var(--sb-wireframe-ink); font: inherit; }
    .sb-wireframe :where([data-go]) { cursor: pointer; }

    .sb-wireframe__primary { border-color: var(--sb-wireframe-accent); background: var(--sb-wireframe-accent); color: var(--sb-wireframe-accent-text); }
    .sb-wireframe__row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .sb-wireframe__stack { display: flex; flex-direction: column; gap: 10px; }
    .sb-wireframe__box { padding: 12px; border: 2px solid var(--sb-wireframe-line); border-radius: 8px; }
    .sb-wireframe__image { min-height: 80px; border: 2px solid var(--sb-wireframe-line); border-radius: 6px; background:
      linear-gradient(to top right, transparent calc(50% - 1px), var(--sb-wireframe-line) 50%, transparent calc(50% + 1px)),
      linear-gradient(to bottom right, transparent calc(50% - 1px), var(--sb-wireframe-line) 50%, transparent calc(50% + 1px)),
      var(--sb-wireframe-fill); }
    .sb-wireframe__text { min-height: 3em; background: repeating-linear-gradient(var(--sb-wireframe-fill) 0 0.6em, transparent 0.6em 1.2em); }

    .sb-wireframe .sb-wireframe--pointed { outline: 2px dashed var(--sb-accent, #2563eb); outline-offset: 2px; }
    .sb-wireframe .sb-wireframe--highlighted { outline: 3px solid var(--sb-accent, #2563eb); outline-offset: 2px; box-shadow: 0 0 0 7px var(--sb-accent-soft, #eaf0ff); }

    .sb-wireframe__bar { display: flex; flex-wrap: wrap; gap: 4px; margin: -16px -16px 16px; padding: 6px 8px; border-bottom: 2px solid var(--sb-wireframe-line); border-radius: 8px 8px 0 0; background: var(--sb-wireframe-fill); }
    .sb-wireframe__step { position: relative; padding: 2px 10px; border: 0; border-radius: 4px; background: none; color: var(--sb-wireframe-ink); font: 600 12px var(--sb-font, system-ui, sans-serif); opacity: 0.7; cursor: pointer; }
    .sb-wireframe__step:hover { opacity: 1; }
    .sb-wireframe__step[aria-current="true"] { background: var(--sb-wireframe-paper); opacity: 1; }
    .sb-wireframe__step--holds-highlight::after { content: ''; position: absolute; top: 2px; right: 2px; width: 6px; height: 6px; border-radius: 50%; background: var(--sb-accent, #2563eb); }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-wireframe-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-wireframe-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbWireframe extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['screen'];

    constructor() {
      super();
      this._screen = null;
      this._highlight = [];
      this._pointed = null;
      this._bar = Object.assign(document.createElement('nav'), { className: 'sb-wireframe__bar' });
      this._bar.setAttribute('aria-label', 'Screens');
      // Screens added later, or content the sandbox rewrites, are picked up too.
      this._observer = new MutationObserver(() => this._render());
      this.addEventListener('click', (e) => this._onClick(e));
      this.addEventListener('submit', (e) => e.preventDefault()); // a prototype's forms never leave the page
      this.addEventListener('pointerover', (e) => this._pointAt(e.target));
      this.addEventListener('focusin', (e) => this._pointAt(e.target));
      this.addEventListener('pointerleave', () => this._pointAt(null));
      this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this._pointAt(null); });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-wireframe');
      // Screens are children, so wait until they have been parsed.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._start(), { once: true });
      } else {
        this._start();
      }
    }

    disconnectedCallback() {
      this._observer.disconnect();
    }

    attributeChangedCallback(name, old, value) { this.screen = value; }

    // ---- Public API ----

    // The children marked data-screen. With none, everything inside is one screen.
    get screens() {
      return [...this.children].filter((child) => child.hasAttribute('data-screen'));
    }

    // The data-screen of the screen showing (the first, if the chosen one doesn't exist). Setting it
    // fires no event: sb-navigate reports the viewer's moves.
    get screen() {
      const ids = this.screens.map((s) => s.dataset.screen);
      return ids.includes(this._screen) ? this._screen : ids[0] ?? null;
    }
    set screen(id) {
      this._screen = id == null ? null : String(id);
      this._render();
    }

    // The data-refs to point at. A highlighted part on another screen marks that screen's step.
    get highlight() { return this._highlight; }
    set highlight(refs) {
      this._highlight = (refs || []).map(String);
      this._showHighlight();
    }

    // Goes to the screen holding `place`, or else the first part marked with the ref, and
    // highlights it. False if there's no such part.
    reveal(ref, place) {
      const part = place && this.contains(place) ? place : this._parts().find((p) => p.dataset.ref === String(ref));
      if (!part) return false;
      const screen = this.screens.find((s) => s.contains(part));
      if (screen) this.screen = screen.dataset.screen;
      this.highlight = [String(ref)];
      return true;
    }

    // ---- Rendering ----

    _start() {
      this._started = true;
      this._render();
      this._observer.observe(this, { childList: true });
    }

    // Shows one screen, and the bar naming them all.
    _render() {
      if (!this._started) return;
      const screens = this.screens;
      for (const screen of screens) screen.hidden = screen.dataset.screen !== this.screen;
      this._renderBar(screens);
      this._showHighlight();
    }

    _renderBar(screens) {
      if (!screens.length) return this._bar.remove();
      if (this.firstElementChild !== this._bar) this.prepend(this._bar);
      this._bar.innerHTML = screens.map((s) => {
        const id = s.dataset.screen;
        return `<button type="button" class="sb-wireframe__step" data-step="${esc(id)}" aria-current="${id === this.screen}">${esc(s.getAttribute('heading') || id)}</button>`;
      }).join('');
    }

    _showHighlight() {
      for (const part of this._parts()) {
        part.classList.toggle('sb-wireframe--highlighted', this._highlight.includes(part.dataset.ref));
        part.classList.toggle('sb-wireframe--pointed', part.dataset.ref === this._pointed);
      }
      for (const step of this._bar.children) {
        const screen = this.screens.find((s) => s.dataset.screen === step.dataset.step);
        const holds = step.dataset.step !== this.screen && this._parts(screen).some((p) => this._highlight.includes(p.dataset.ref));
        step.classList.toggle('sb-wireframe__step--holds-highlight', holds);
      }
    }

    _parts(within = this) {
      return within ? [...within.querySelectorAll('[data-ref]')] : [];
    }

    // ---- Interaction ----

    // The nearest element matching the selector, inside this wireframe.
    _closest(target, selector) {
      const found = target?.closest?.(selector);
      return found && found !== this && this.contains(found) ? found : null;
    }

    // A click on a part selects it; a click on data-go then moves to that screen.
    _onClick(e) {
      const step = this._closest(e.target, '.sb-wireframe__step');
      if (step) return this._go(step.dataset.step);
      const part = this._closest(e.target, '[data-ref]');
      if (part) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { ref: part.dataset.ref, screen: this.screen } }));
      const link = this._closest(e.target, '[data-go]');
      if (link) {
        e.preventDefault();
        this._go(link.dataset.go);
      }
    }

    _go(id) {
      const from = this.screen;
      if (id === from || !this.screens.some((s) => s.dataset.screen === id)) return;
      this.screen = id;
      this._pointAt(null);
      this.dispatchEvent(new CustomEvent('sb-navigate', { bubbles: true, detail: { screen: id, from } }));
    }

    // Pointing at a part lights every part with its ref, and tells the sandbox.
    _pointAt(target) {
      const ref = this._closest(target, '[data-ref]')?.dataset.ref ?? null;
      if (ref === this._pointed) return;
      this._pointed = ref;
      this._showHighlight();
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: { ref } }));
    }
  }

  customElements.define('sb-wireframe', SbWireframe);
})();
