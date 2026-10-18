// Sandkit sb-panel 0.1.2 · MIT Licence · https://github.com/sebjwallace/sandkit
// A frame that lets viewers rearrange a sandbox: wrap any content in a panel, and viewers can pop
// it out into a floating window, drag and resize it, collapse it, make it full screen, and dock it
// back where it started. The panel never looks inside its content.
//
//   <sb-panel id="rules" heading="Rules"> …any content… </sb-panel>
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-panel';
  const existing = customElements.get('sb-panel');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-panel>, so only one can run. Rename one by replacing every "sb-panel" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-panel { box-sizing: border-box; display: flex; flex-direction: column; min-width: 0; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); }
    .sb-panel__bar { display: flex; align-items: center; gap: 8px; padding: 4px 6px 4px 12px; border-bottom: 1px solid var(--sb-border, #d5d9e0); background: var(--sb-surface-2, #eef0f3); border-radius: var(--sb-radius, 8px) var(--sb-radius, 8px) 0 0; user-select: none; }
    .sb-panel__heading { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 600; }
    .sb-panel__button { display: inline-flex; padding: 4px; border: 0; border-radius: 4px; background: none; color: var(--sb-muted, #616e7c); cursor: pointer; }
    .sb-panel__button:hover { background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); }
    .sb-panel__body { flex: 1; min-height: 0; overflow: auto; padding: 12px; }
    .sb-panel[collapsed] { align-self: start; } /* shrink to the bar, even in a grid or flex layout that stretches */
    .sb-panel[collapsed] .sb-panel__body { display: none; }
    .sb-panel[collapsed] .sb-panel__bar { border-bottom: 0; border-radius: var(--sb-radius, 8px); }

    .sb-panel[floating] { position: fixed; margin: 0; resize: both; overflow: hidden; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28); }
    .sb-panel[floating] .sb-panel__bar { cursor: move; }
    .sb-panel[floating][collapsed] { height: auto !important; resize: none; }
    .sb-panel:fullscreen { border: 0; border-radius: 0; }

    .sb-panel__placeholder { box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px dashed var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); color: var(--sb-muted, #616e7c); font-size: 13px; }
    .sb-panel__placeholder button { font: inherit; padding: 3px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); cursor: pointer; }`;

  // Icon outlines (Feather, MIT), drawn in the current text colour.
  const ICON_PATHS = {
    collapse: '<polyline points="18 15 12 9 6 15"/>',
    expand: '<polyline points="6 9 12 15 18 9"/>',
    popOut: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    dock: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>',
    enterFullscreen: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
    exitFullscreen: '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>'
  };

  const VIEWPORT_MARGIN = 8;   // floating panels stay at least this far inside the window
  const MIN_VISIBLE_BAR = 60;  // and keep this much of their title bar on screen
  let frontmost = 1000;        // the z-index of the panel most recently brought to the front

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const icon = (name) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;

  function addStyle() {
    if (document.getElementById('sb-panel-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-panel-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Panels with an id remember how each viewer arranged them.
  const storage = {
    read(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* kept for this visit only */ }
    }
  };

  // Keeps a floating panel reachable: never off the top, and always with some of its bar on screen.
  function clampToViewport({ left, top, width }) {
    return {
      left: Math.min(Math.max(left, MIN_VISIBLE_BAR - width), innerWidth - MIN_VISIBLE_BAR),
      top: Math.min(Math.max(top, VIEWPORT_MARGIN), innerHeight - MIN_VISIBLE_BAR)
    };
  }

  class SbPanel extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['heading'];

    constructor() {
      super();
      this._placeholder = null;
      this._onFullscreenChange = () => this._showState();
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-panel');
      document.addEventListener('fullscreenchange', this._onFullscreenChange);
      if (this._built) return;
      // The panel takes its children as content, so wait until they have been parsed.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      } else {
        this._build();
      }
    }

    disconnectedCallback() {
      document.removeEventListener('fullscreenchange', this._onFullscreenChange);
    }

    attributeChangedCallback() {
      if (this._built) this.querySelector('.sb-panel__heading').textContent = this.getAttribute('heading') ?? '';
    }

    // ---- Public API ----

    get floating() { return this.hasAttribute('floating'); }
    get collapsed() { return this.hasAttribute('collapsed'); }

    // Lifts the panel out of the page into a floating window, leaving a placeholder of the same
    // size so nothing else moves. Without a position, it floats exactly where it was.
    popOut(position = {}) {
      if (this.floating) return;
      const rect = this.getBoundingClientRect();
      this._placeholder = this._makePlaceholder(rect.height);
      this.before(this._placeholder);
      const width = position.width ?? rect.width;
      const { left, top } = clampToViewport({ left: position.left ?? rect.left, top: position.top ?? rect.top, width });
      Object.assign(this.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${position.height ?? rect.height}px` });
      this.setAttribute('floating', '');
      this.bringToFront();
      this._changed();
    }

    // Returns the panel to where the sandbox placed it.
    dock() {
      if (!this.floating) return;
      this._placeholder?.remove();
      this._placeholder = null;
      this.removeAttribute('floating');
      for (const property of ['left', 'top', 'width', 'height', 'zIndex']) this.style[property] = '';
      this._changed();
    }

    toggleCollapsed() {
      this.toggleAttribute('collapsed');
      this._changed();
    }

    toggleFullscreen() {
      // Browsers may refuse full screen (e.g. in some embedded previews); the panel simply stays as it is.
      if (document.fullscreenElement === this) document.exitFullscreen();
      else this.requestFullscreen?.().catch(() => {});
    }

    bringToFront() {
      if (this.floating) this.style.zIndex = String(++frontmost);
    }

    // Shows what the panel holds, if it holds `place`, or else a part marked data-ref="ref":
    // expands it and brings it to the front. Quiet, and not remembered as the viewer's choice.
    // False if it holds no such part.
    reveal(ref, place) {
      const holds = place ? this.contains(place) : [...this.querySelectorAll('[data-ref]')].some((el) => el.dataset.ref === String(ref));
      if (!holds) return false;
      this.removeAttribute('collapsed');
      this._showState();
      this.bringToFront();
      return true;
    }

    // ---- Building ----

    _build() {
      if (this._built) return; // a panel moved while the page loads is asked twice
      this._built = true;
      const body = Object.assign(document.createElement('div'), { className: 'sb-panel__body' });
      body.append(...this.childNodes);
      this.innerHTML = `
        <div class="sb-panel__bar">
          <span class="sb-panel__heading">${esc(this.getAttribute('heading'))}</span>
          <button type="button" class="sb-panel__button" data-action="collapse"></button>
          <button type="button" class="sb-panel__button" data-action="float"></button>
          ${document.fullscreenEnabled ? '<button type="button" class="sb-panel__button" data-action="fullscreen"></button>' : ''}
        </div>`;
      this.append(body);

      this.addEventListener('click', (e) => this._onClick(e));
      this.addEventListener('pointerdown', (e) => this._onPointerDown(e));
      this.addEventListener('pointerup', () => { if (this.floating) this._save(); }); // after resizing from the corner
      this._restore();
      this._showState();
    }

    _makePlaceholder(height) {
      const placeholder = Object.assign(document.createElement('div'), { className: 'sb-panel__placeholder' });
      placeholder.style.height = `${height}px`;
      placeholder.innerHTML = `<span>${esc(this.getAttribute('heading') || 'Panel')} is popped out</span><button type="button">Dock here</button>`;
      placeholder.querySelector('button').addEventListener('click', () => this.dock());
      return placeholder;
    }

    // ---- Interaction ----

    _onClick(e) {
      switch (e.target.closest('[data-action]')?.dataset.action) {
        case 'collapse': return this.toggleCollapsed();
        case 'float': return this.floating ? this.dock() : this.popOut();
        case 'fullscreen': return this.toggleFullscreen();
      }
    }

    // A floating panel comes to the front when touched, and moves when dragged by its bar.
    _onPointerDown(e) {
      if (!this.floating) return;
      this.bringToFront();
      if (!e.target.closest('.sb-panel__bar') || e.target.closest('button')) return;
      e.preventDefault();
      const start = { x: e.clientX, y: e.clientY, left: this.offsetLeft, top: this.offsetTop };
      const move = (event) => {
        const { left, top } = clampToViewport({ left: start.left + event.clientX - start.x, top: start.top + event.clientY - start.y, width: this.offsetWidth });
        Object.assign(this.style, { left: `${left}px`, top: `${top}px` });
      };
      const stop = () => {
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', stop);
        this._save();
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', stop);
    }

    // ---- State ----

    _changed() {
      this._showState();
      this._save();
      this.dispatchEvent(new CustomEvent('sb-layout', { bubbles: true, detail: { floating: this.floating, collapsed: this.collapsed } }));
    }

    _showState() {
      if (!this._built) return;
      this._setButton('collapse', this.collapsed ? 'expand' : 'collapse', this.collapsed ? 'Expand' : 'Collapse');
      this.querySelector('[data-action="collapse"]').setAttribute('aria-expanded', String(!this.collapsed));
      this._setButton('float', this.floating ? 'dock' : 'popOut', this.floating ? 'Dock' : 'Pop out');
      const isFullscreen = document.fullscreenElement === this;
      this._setButton('fullscreen', isFullscreen ? 'exitFullscreen' : 'enterFullscreen', isFullscreen ? 'Exit full screen' : 'Full screen');
    }

    _setButton(action, iconName, label) {
      const button = this.querySelector(`[data-action="${action}"]`);
      if (!button) return;
      button.innerHTML = icon(iconName);
      button.setAttribute('aria-label', label);
      button.title = label;
    }

    get _storageKey() { return this.id ? `sb-panel:${this.id}` : null; }

    _save() {
      if (!this._storageKey) return;
      const layout = { floating: this.floating, collapsed: this.collapsed };
      if (this.floating) Object.assign(layout, { left: this.offsetLeft, top: this.offsetTop, width: this.offsetWidth, height: this.offsetHeight });
      storage.write(this._storageKey, layout);
    }

    _restore() {
      const saved = this._storageKey && storage.read(this._storageKey);
      if (!saved) return;
      this.toggleAttribute('collapsed', Boolean(saved.collapsed));
      if (saved.floating) this.popOut(saved);
    }
  }

  customElements.define('sb-panel', SbPanel);
})();
