// Sandkit sb-math 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// Mathematics people can point into. Wraps ordinary MathML, which browsers draw natively; any part
// marked data-ref="…" announces a highlight when hovered or focused, and lights up when anything
// else on the page announces the same ref. Follows the highlighting practice
// (practices/highlighting.md).
//
//   <sb-math>
//     <math><mi data-ref="i-hat">î</mi><mo>+</mo><mi data-ref="j-hat">ĵ</mi></math>
//   </sb-math>
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-math';
  const existing = customElements.get('sb-math');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-math>, so only one can run. Rename one by replacing every "sb-math" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-math { display: inline-block; font-size: 1.15em; }
    .sb-math [data-ref] { cursor: help; border-radius: 3px; }
    .sb-math [data-ref]:focus { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-math .sb-math--lit { background: var(--sb-accent-soft, #eaf0ff); color: var(--sb-accent, #2563eb); }`;

  function addStyle() {
    if (document.getElementById('sb-math-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-math-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // The page-wide highlight: { ref } while something is pointed at, { ref: null } when it isn't.
  const announce = (ref) => document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref } }));

  class SbMath extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._onHighlight = (e) => this._light(e.detail?.ref ?? null);
      // Parts marked later (for example, when a sandbox rewrites the equation) become focusable too.
      this._observer = new MutationObserver(() => this._makeFocusable());
      this.addEventListener('pointerover', (e) => this._point(e.target));
      this.addEventListener('focusin', (e) => this._point(e.target));
      this.addEventListener('pointerout', (e) => this._leave(e.target, e.relatedTarget));
      this.addEventListener('focusout', (e) => this._leave(e.target, e.relatedTarget));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-math');
      document.addEventListener('sb-highlight', this._onHighlight);
      this._observer.observe(this, { childList: true, subtree: true });
      this._makeFocusable();
    }

    disconnectedCallback() {
      document.removeEventListener('sb-highlight', this._onHighlight);
      this._observer.disconnect();
    }

    // Marked parts can be reached with the keyboard, so pointing doesn't need a mouse.
    _makeFocusable() {
      for (const part of this.querySelectorAll('[data-ref]:not([tabindex])')) part.setAttribute('tabindex', '0');
    }

    _point(target) {
      const ref = target.closest?.('[data-ref]')?.dataset.ref;
      if (ref && ref !== this._pointing) {
        this._pointing = ref;
        announce(ref);
      }
    }

    // Leaving a marked part ends the highlight, unless the pointer moved to another part of it.
    _leave(target, next) {
      const part = target.closest?.('[data-ref]');
      if (!part || part.contains(next)) return;
      const nextRef = next?.closest?.('[data-ref]')?.dataset.ref;
      if (nextRef && this.contains(next)) return; // pointerover on the next part announces it
      this._pointing = null;
      announce(null);
    }

    _light(ref) {
      for (const part of this.querySelectorAll('[data-ref]')) part.classList.toggle('sb-math--lit', ref !== null && part.dataset.ref === ref);
    }
  }

  customElements.define('sb-math', SbMath);
})();
