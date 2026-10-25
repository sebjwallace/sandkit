// Sandkit sb-inspect-mode 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// Inspect mode: point at a part of the page to be told exactly what it is. Pointing outlines the
// innermost part the sandbox can explain and, after a moment, shows its explanation in a card at
// the side: a definition, the data behind it, the rules it takes part in, whatever explains it
// best. A click holds the card on that part, and never acts. A mode, chosen in the shell's picker.
//
//   <sb-inspect-mode slot="modes"></sb-inspect-mode>
//   inspect.explain = (ref) => ref === 'gauge-2' ? { kind: 'Gauge', title: 'Mill Bridge', body: '<p>…</p>' } : null;
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-inspect-mode';
  const existing = customElements.get('sb-inspect-mode');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-inspect-mode>, so only one can run. Rename one by replacing every "sb-inspect-mode" in its file.`);
    }
    return;
  }

  const DELAY = 120; // ms of pointing before showing, so crossing parts on the way doesn't flicker

  const CSS = `
    .sb-inspect-mode { --sb-inspect-mode-tone: var(--sb-warn, #d69e2e); display: contents; }
    .sb-inspect-mode__dim { position: fixed; inset: 0; margin: 0; padding: 0; border: 0; width: auto; height: auto; background: var(--sb-inspect-mode-dim, rgba(0, 0, 0, 0.12)); box-shadow: inset 0 0 0 4px var(--sb-inspect-mode-tone); pointer-events: none; }
    .sb-inspect-mode__banner { position: fixed; inset: auto auto 16px 50%; transform: translateX(-50%); margin: 0; display: none; align-items: center; gap: 10px; padding: 6px 8px 6px 14px; border: 2px solid var(--sb-inspect-mode-tone); border-radius: 999px; background: color-mix(in srgb, var(--sb-inspect-mode-tone) 12%, var(--sb-surface, #fff)); color: var(--sb-text, #1f2933); font: 600 13px var(--sb-font, system-ui, sans-serif); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); }
    .sb-inspect-mode__banner:popover-open { display: inline-flex; }
    .sb-inspect-mode__button { padding: 5px 12px; border: 1px solid var(--sb-inspect-mode-tone); border-radius: var(--sb-radius, 8px); background: color-mix(in srgb, var(--sb-inspect-mode-tone) 22%, var(--sb-surface, #fff)); color: var(--sb-text, #1f2933); font: inherit; cursor: pointer; }
    .sb-inspect-mode__button:focus-visible { outline: 2px solid var(--sb-inspect-mode-tone); outline-offset: 1px; }
    .sb-inspect-mode__outline { position: fixed; box-sizing: border-box; margin: 0; padding: 0; border: 2px dashed var(--sb-inspect-mode-tone); border-radius: 4px; background: color-mix(in srgb, var(--sb-inspect-mode-tone) 10%, transparent); pointer-events: none; }
    .sb-inspect-mode--held .sb-inspect-mode__outline { border-style: solid; }
    .sb-inspect-mode__card { position: fixed; inset: 72px 16px auto auto; box-sizing: border-box; width: min(360px, calc(100vw - 32px)); max-height: calc(100vh - 150px); margin: 0; padding: 0; flex-direction: column; overflow: hidden; border: 2px solid var(--sb-inspect-mode-tone); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 14px/1.5 var(--sb-font, system-ui, sans-serif); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28); }
    .sb-inspect-mode__card:popover-open { display: flex; }
    .sb-inspect-mode__bar { display: flex; flex: none; align-items: center; gap: 10px; padding: 6px 12px; border-bottom: 1px solid var(--sb-border, #d5d9e0); background: var(--sb-surface-2, #eef0f3); cursor: move; touch-action: none; user-select: none; }
    .sb-inspect-mode__grip { flex: none; width: 10px; height: 14px; color: var(--sb-muted, #616e7c); background: radial-gradient(circle, currentColor 1.3px, transparent 1.6px) 0 0 / 5px 5px; }
    .sb-inspect-mode__kind { color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .sb-inspect-mode__body { padding: 10px 14px 12px; overflow-y: auto; }
    .sb-inspect-mode__title { margin: 0 0 8px; font-size: 16px; font-weight: 700; }
    .sb-inspect-mode__title:empty { display: none; }
    .sb-inspect-mode__content > :first-child { margin-top: 0; }
    .sb-inspect-mode__content > :last-child { margin-bottom: 0; }`;

  // Viewers' clicks and presses, stopped in inspect mode so they hold instead of act.
  const STOPPED = ['click', 'dblclick', 'pointerdown', 'pointerup', 'mousedown', 'mouseup'];

  // What every mode lets through (data-modes, such as the shell's mode picker), and open dialogs.
  const LET_THROUGH = '[data-modes], dialog[open]';

  const POINTING = 'Inspecting: point at anything outlined to see what it is';
  const HOLDING = 'Held: click it again, or anywhere else, to let go';

  function addStyle() {
    if (document.getElementById('sb-inspect-mode-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-inspect-mode-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Puts text or an element into a container, replacing what was there. Text is never markup.
  function fill(container, content) {
    container.replaceChildren();
    if (content instanceof Node) container.append(content);
    else container.textContent = content ?? '';
  }

  class SbInspectMode extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._active = false;
      this._shown = null;   // { ref, part } explained in the card, or null
      this._held = false;
      this._timer = null;
      this.explain = () => null; // the sandbox says what each ref is
      this._stop = (e) => this._intercept(e);
      this._point = (e) => this._wait(e.target);
      this._escape = (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) this._end(); };
      this._follow = () => this._placeOutline();
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-inspect-mode');
      if (this._built) return;
      this._built = true;
      this._render();
      this.active = this._active;
    }

    disconnectedCallback() {
      this._listen(false);
      clearTimeout(this._timer);
    }

    // ---- Public API ----

    // The mode's name, in the shell's mode picker.
    get heading() { return this.getAttribute('heading') || 'Inspect'; }

    // Whether inspect mode is on. Setting it fires no event: sb-mode reports the viewer's choices.
    get active() { return this._active; }
    set active(on) {
      this._active = Boolean(on);
      if (!this._built) return;
      this._listen(this._active);
      this._dim.togglePopover(this._active);
      this._banner.togglePopover(this._active);
      if (!this._active) this._clear();
    }

    // The ref explained in the card now, or null.
    get current() { return this._shown?.ref ?? null; }

    // Explains a ref and holds it, as a click would, outlining `part` if given. Only while the
    // mode is on. Quiet: no sb-inspect. False if off, or if the sandbox has nothing to say.
    show(ref, part = null) {
      if (!this._active) return false;
      const entry = this.explain(ref, part);
      if (!entry) return false;
      this._display(ref, part, entry);
      this._hold(true);
      return true;
    }

    // ---- Building ----

    _render() {
      this.innerHTML = `
        <div class="sb-inspect-mode__dim" popover="manual"></div>
        <div class="sb-inspect-mode__outline" popover="manual"></div>
        <section class="sb-inspect-mode__card" popover="manual" aria-label="What this is">
          <div class="sb-inspect-mode__bar" title="Drag to move">
            <span class="sb-inspect-mode__grip"></span>
            <span class="sb-inspect-mode__kind"></span>
          </div>
          <div class="sb-inspect-mode__body">
            <div class="sb-inspect-mode__title"></div>
            <div class="sb-inspect-mode__content"></div>
          </div>
        </section>
        <div class="sb-inspect-mode__banner" popover="manual">
          <span class="sb-inspect-mode__words">${POINTING}</span>
          <button type="button" class="sb-inspect-mode__button">Stop</button>
        </div>`;
      this._dim = this.querySelector('.sb-inspect-mode__dim');
      this._banner = this.querySelector('.sb-inspect-mode__banner');
      this._outlineBox = this.querySelector('.sb-inspect-mode__outline');
      this._card = this.querySelector('.sb-inspect-mode__card');
      this.querySelector('.sb-inspect-mode__button').addEventListener('click', () => this._end());
      this._draggable(this.querySelector('.sb-inspect-mode__bar'));
    }

    // The card moves by its bar, so it never has to cover a part someone wants to inspect.
    // It stays where it's dropped, kept within the window.
    _draggable(bar) {
      bar.addEventListener('pointerdown', (e) => {
        const box = this._card.getBoundingClientRect();
        const offset = { x: e.clientX - box.left, y: e.clientY - box.top };
        const move = (m) => {
          const left = Math.min(Math.max(0, m.clientX - offset.x), innerWidth - box.width);
          const top = Math.min(Math.max(0, m.clientY - offset.y), innerHeight - 40);
          Object.assign(this._card.style, { left: `${left}px`, top: `${top}px`, right: 'auto' });
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

    _listen(on) {
      const method = on ? addEventListener : removeEventListener;
      for (const type of STOPPED) method(type, this._stop, true);
      method('pointerover', this._point, true);
      method('keydown', this._escape, true);
      method('scroll', this._follow, true);
      method('resize', this._follow);
    }

    // ---- Inspecting ----

    // The innermost part, at or around the target, that the sandbox can explain, with its explanation.
    _explainAt(target) {
      if (this.contains(target) || target.closest?.(LET_THROUGH)) return null;
      for (let part = target.closest?.('[data-ref]'); part; part = part.parentElement?.closest('[data-ref]')) {
        const entry = this.explain(part.dataset.ref, part);
        if (entry) return { ref: part.dataset.ref, part, entry };
      }
      return null;
    }

    // Pointing at a part shows it after a moment. Pointing at anything else cancels what was on its
    // way and keeps what's shown, so the pointer can travel to the card.
    _wait(target) {
      clearTimeout(this._timer);
      if (this._held || this.contains(target)) return;
      const part = target.closest?.('[data-ref]');
      if (!part || part === this._shown?.part) return;
      this._timer = setTimeout(() => {
        const found = this._explainAt(target);
        if (found) this._viewerShows(found);
      }, DELAY);
    }

    // A click anywhere but the mode's own parts, or what every mode lets through, holds instead of
    // acting: a part to explain is held, the part held lets go, and anywhere else lets go.
    _intercept(e) {
      if (this.contains(e.target) || e.target.closest?.(LET_THROUGH)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.type !== 'click') return;
      clearTimeout(this._timer);
      const found = this._explainAt(e.target);
      if (!found || (this._held && found.part === this._shown?.part)) return this._hold(false);
      if (found.part !== this._shown?.part) this._viewerShows(found);
      this._hold(true);
    }

    _viewerShows({ ref, part, entry }) {
      this._display(ref, part, entry);
      this.dispatchEvent(new CustomEvent('sb-inspect', { bubbles: true, detail: { ref } }));
    }

    _display(ref, part, entry) {
      this._shown = { ref, part };
      fill(this.querySelector('.sb-inspect-mode__kind'), entry.kind);
      fill(this.querySelector('.sb-inspect-mode__title'), entry.title);
      const content = this.querySelector('.sb-inspect-mode__content');
      if (entry.body instanceof Node) content.replaceChildren(entry.body);
      else content.innerHTML = entry.body ?? ''; // the sandbox's own HTML
      this._card.togglePopover(true);
      this._outlineBox.togglePopover(Boolean(part));
      this._placeOutline();
    }

    _hold(on) {
      this._held = on;
      this.classList.toggle('sb-inspect-mode--held', on);
      this.querySelector('.sb-inspect-mode__words').textContent = on ? HOLDING : POINTING;
    }

    // Drawn over the part in the top layer, so nothing is added to what anyone else drew.
    _placeOutline() {
      const part = this._shown?.part;
      if (!part) return;
      if (!part.isConnected) return this._outlineBox.togglePopover(false);
      const r = part.getBoundingClientRect();
      Object.assign(this._outlineBox.style, { left: `${r.left - 4}px`, top: `${r.top - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px` });
    }

    _clear() {
      clearTimeout(this._timer);
      this._shown = null;
      this._hold(false);
      this._card.togglePopover(false);
      this._outlineBox.togglePopover(false);
    }

    // The viewer stopped inspecting, with Stop or Escape.
    _end() {
      this.active = false;
      this.dispatchEvent(new CustomEvent('sb-mode', { bubbles: true, detail: { mode: this.heading, active: false } }));
    }
  }

  customElements.define('sb-inspect-mode', SbInspectMode);
})();
