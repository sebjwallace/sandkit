// Sandkit sb-trace-mode 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Trace mode: a click on a part of the page asks why it's there, instead of acting. Pointing
// outlines the innermost part whose ref the sandbox says is traceable; a click on it fires
// sb-pick with that ref, and the sandbox shows the trace. A mode, chosen in the shell's picker.
//
//   <sb-trace-mode slot="modes"></sb-trace-mode>
//   trace.traceable = (ref) => model.items.some((item) => item.id === ref);
//   trace.addEventListener('sb-pick', (e) => openTrace(e.detail.ref));
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-trace-mode';
  const existing = customElements.get('sb-trace-mode');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-trace-mode>, so only one can run. Rename one by replacing every "sb-trace-mode" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-trace-mode { --sb-trace-mode-tone: var(--sb-warn, #d69e2e); display: contents; }
    .sb-trace-mode__dim { position: fixed; inset: 0; margin: 0; padding: 0; border: 0; width: auto; height: auto; background: var(--sb-trace-mode-dim, rgba(0, 0, 0, 0.12)); box-shadow: inset 0 0 0 4px var(--sb-trace-mode-tone); pointer-events: none; }
    .sb-trace-mode__banner { position: fixed; inset: auto auto 16px 50%; transform: translateX(-50%); margin: 0; display: none; align-items: center; gap: 10px; padding: 6px 8px 6px 14px; border: 2px solid var(--sb-trace-mode-tone); border-radius: 999px; background: color-mix(in srgb, var(--sb-trace-mode-tone) 12%, var(--sb-surface, #fff)); color: var(--sb-text, #1f2933); font: 600 13px var(--sb-font, system-ui, sans-serif); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); }
    .sb-trace-mode__banner:popover-open { display: inline-flex; }
    .sb-trace-mode__button { padding: 5px 12px; border: 1px solid var(--sb-trace-mode-tone); border-radius: var(--sb-radius, 8px); background: color-mix(in srgb, var(--sb-trace-mode-tone) 22%, var(--sb-surface, #fff)); color: var(--sb-text, #1f2933); font: inherit; cursor: pointer; }
    .sb-trace-mode__button:focus-visible { outline: 2px solid var(--sb-trace-mode-tone); outline-offset: 1px; }
    .sb-trace-mode__outline { position: fixed; box-sizing: border-box; margin: 0; padding: 0; border: 2px dashed var(--sb-trace-mode-tone); border-radius: 4px; background: color-mix(in srgb, var(--sb-trace-mode-tone) 10%, transparent); pointer-events: none; }`;

  // Viewers' clicks and presses, stopped in trace mode so they pick instead of act.
  const STOPPED = ['click', 'dblclick', 'pointerdown', 'pointerup', 'mousedown', 'mouseup'];

  // What every mode lets through (data-modes, such as the shell's mode picker), and open dialogs,
  // such as the one the sandbox shows a trace in.
  const LET_THROUGH = '[data-modes], dialog[open]';

  function addStyle() {
    if (document.getElementById('sb-trace-mode-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-trace-mode-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbTraceMode extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._active = false;
      this._outlined = null;         // the part outlined under the pointer
      this.traceable = () => false;  // the sandbox says which refs can be traced
      this._stop = (e) => this._intercept(e);
      this._point = (e) => this._outline(this._partAt(e.target));
      this._escape = (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) this._end(); };
      this._follow = () => this._placeOutline();
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-trace-mode');
      if (this._built) return;
      this._built = true;
      this._render();
      this.active = this._active;
    }

    disconnectedCallback() {
      this._listen(false);
    }

    // ---- Public API ----

    // The mode's name, in the shell's mode picker.
    get heading() { return this.getAttribute('heading') || 'Trace'; }

    // Whether trace mode is on. Setting it fires no event: sb-mode reports the viewer's choices.
    get active() { return this._active; }
    set active(on) {
      this._active = Boolean(on);
      if (!this._built) return;
      this._listen(this._active);
      this._dim.togglePopover(this._active);
      this._banner.togglePopover(this._active);
      if (!this._active) this._outline(null);
    }

    // ---- Building ----

    _render() {
      this.innerHTML = `
        <div class="sb-trace-mode__dim" popover="manual"></div>
        <div class="sb-trace-mode__banner" popover="manual">
          <span>Tracing: click anything outlined to see why it's there</span>
          <button type="button" class="sb-trace-mode__button">Stop</button>
        </div>
        <div class="sb-trace-mode__outline" popover="manual"></div>`;
      this._dim = this.querySelector('.sb-trace-mode__dim');
      this._banner = this.querySelector('.sb-trace-mode__banner');
      this._outlineBox = this.querySelector('.sb-trace-mode__outline');
      this.querySelector('.sb-trace-mode__button').addEventListener('click', () => this._end());
    }

    // ---- Tracing ----

    _listen(on) {
      const method = on ? addEventListener : removeEventListener;
      for (const type of STOPPED) method(type, this._stop, true);
      method('pointerover', this._point, true);
      method('keydown', this._escape, true);
      method('scroll', this._follow, true);
      method('resize', this._follow);
    }

    // The innermost part, at or around the target, whose ref the sandbox says is traceable.
    _partAt(target) {
      if (this.contains(target) || target.closest?.(LET_THROUGH)) return null;
      for (let part = target.closest?.('[data-ref]'); part; part = part.parentElement?.closest('[data-ref]')) {
        if (this.traceable(part.dataset.ref)) return part;
      }
      return null;
    }

    // A click anywhere but the mode's own parts, or what every mode lets through, traces instead of acting.
    _intercept(e) {
      if (this.contains(e.target) || e.target.closest?.(LET_THROUGH)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.type !== 'click') return;
      const part = this._partAt(e.target);
      if (part) this._fire('sb-pick', { ref: part.dataset.ref });
    }

    // Drawn over the part in the top layer, so nothing is added to what anyone else drew.
    _outline(part) {
      this._outlined = part;
      this._outlineBox.togglePopover(Boolean(part));
      this._placeOutline();
    }

    _placeOutline() {
      if (!this._outlined) return;
      const r = this._outlined.getBoundingClientRect();
      Object.assign(this._outlineBox.style, { left: `${r.left - 4}px`, top: `${r.top - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px` });
    }

    // The viewer stopped tracing, with Stop or Escape.
    _end() {
      this.active = false;
      this._fire('sb-mode', { mode: this.heading, active: false });
    }

    _fire(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    }
  }

  customElements.define('sb-trace-mode', SbTraceMode);
})();
