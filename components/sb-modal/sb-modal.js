// Sandkit sb-modal 0.1.3 · MIT Licence · https://github.com/sebjwallace/sandkit
// A window over the page that holds attention until it is closed: an explanation, a decision or
// a closer look. Modals stack, each over the last. Built on the browser's own modal dialog, which keeps focus inside,
// closes on Escape and returns focus when done. Its content is whatever is inside it.
//
//   <sb-modal heading="Why did the shelf run empty?" expandable>
//     <p>Demand rose faster than the warehouse could reorder.</p>
//     <button slot="actions" data-close="replay">Replay the week</button>
//   </sb-modal>
//   modal.show();
//   modal.addEventListener('sb-close', (e) => e.detail.reason === 'replay' && replay());
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-modal';
  const existing = customElements.get('sb-modal');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-modal>, so only one can run. Rename one by replacing every "sb-modal" in its file.`);
    }
    return;
  }

  // The element itself takes no space, so the dialog can lie over the page wherever it is placed.
  // Buttons in the actions get a plain look of low weight, so a sandbox's own button styles win.
  const CSS = `
    .sb-modal { display: contents; }
    .sb-modal__dialog { box-sizing: border-box; flex-direction: column; width: min(var(--sb-modal-width, 560px), calc(100vw - 32px)); height: var(--sb-modal-height, fit-content); max-height: calc(100vh - 64px); padding: 0; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font-family: var(--sb-font, system-ui, sans-serif); box-shadow: 0 12px 40px rgb(0 0 0 / 0.25); }
    .sb-modal__dialog[open] { display: flex; }
    .sb-modal__dialog--full { width: calc(100vw - 48px); height: calc(100vh - 48px); max-height: none; }
    .sb-modal__dialog::backdrop { background: rgb(0 0 0 / 0.45); }
    .sb-modal__header { display: flex; align-items: center; gap: 12px; padding: 12px 12px 0 18px; }
    .sb-modal__title { flex: 1; margin: 0; font-size: 16px; font-weight: 700; }
    .sb-modal__close { margin-left: auto; padding: 2px 8px; border: none; border-radius: var(--sb-radius, 8px); background: none; color: var(--sb-muted, #616e7c); font: inherit; font-size: 20px; line-height: 1; cursor: pointer; }
    .sb-modal__close:hover { background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); }
    .sb-modal__size { display: grid; place-items: center; margin-left: auto; padding: 5px; border: none; border-radius: var(--sb-radius, 8px); background: none; color: var(--sb-muted, #616e7c); cursor: pointer; }
    .sb-modal__size[hidden] { display: none; }
    .sb-modal__size:hover { background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); }
    .sb-modal__size:not([hidden]) + .sb-modal__close { margin-left: 0; }
    .sb-modal__body { flex: 1; min-height: 0; overflow: auto; padding: 10px 18px 18px; font-size: 14px; line-height: 1.55; }
    .sb-modal__body > :first-child { margin-top: 0; }
    .sb-modal__body > :last-child { margin-bottom: 0; }
    .sb-modal__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; padding: 10px 18px; border-top: 1px solid var(--sb-border, #d5d9e0); }
    .sb-modal__actions:empty { display: none; }
    :where(.sb-modal__actions) > :where(button) { padding: 5px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: inherit; font-size: 13px; cursor: pointer; }
    .sb-modal__dialog :focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 2px; }`;

  function addStyle() {
    if (document.getElementById('sb-modal-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-modal-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Corners pointing out to fill the window, and in to come back to the usual size.
  const icon = (path) => `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const GROW_ICON = icon('M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4');
  const SHRINK_ICON = icon('M6 2v4H2M10 2v4h4M14 10h-4v4M2 10h4v4');

  let count = 0; // numbers each modal, so its title's id is unique in the page

  class SbModal extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['open', 'heading', 'size', 'expandable'];

    connectedCallback() {
      addStyle();
      this.classList.add('sb-modal');
      if (this._built) {
        this._showOpen(); // moved back into the page, perhaps while open
        return;
      }
      // The modal takes its children as content, so wait until they have been parsed.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      } else {
        this._build();
      }
    }

    attributeChangedCallback(name) {
      if (!this._built) return;
      if (name === 'open') this._showOpen();
      else if (name === 'heading') this._showTitle();
      else this._showSize();
    }

    // ---- Public API ----

    // Whether the modal is showing. Setting it fires no event: sb-close reports the viewer's closing.
    get open() { return this.hasAttribute('open'); }
    set open(value) { this.toggleAttribute('open', Boolean(value)); }

    // 'default', sized by its tokens, or 'full', filling the window but for a margin. Setting it
    // fires no event: sb-size reports the viewer's changes.
    get size() { return this.getAttribute('size') === 'full' ? 'full' : 'default'; }
    set size(value) {
      if (value === 'full') this.setAttribute('size', 'full');
      else this.removeAttribute('size');
    }

    show() { this.open = true; }
    close() { this.open = false; }

    // ---- Building ----

    // The content goes into the body, and anything marked slot="actions" into the footer.
    _build() {
      if (this._built) return; // moved while the page loads, it is asked twice
      this._built = true;
      const id = `sb-modal-${++count}`;
      const dialog = Object.assign(document.createElement('dialog'), { className: 'sb-modal__dialog' });
      dialog.innerHTML = `
        <div class="sb-modal__header">
          <h2 class="sb-modal__title" id="${id}-title"></h2>
          <button type="button" class="sb-modal__size" aria-label="Full size" title="Full size"></button>
          <button type="button" class="sb-modal__close" data-close aria-label="Close">×</button>
        </div>
        <div class="sb-modal__body"></div>
        <div class="sb-modal__actions"></div>`;
      const children = [...this.childNodes];
      dialog.querySelector('.sb-modal__actions').append(...children.filter((c) => c.slot === 'actions'));
      dialog.querySelector('.sb-modal__body').append(...children.filter((c) => c.slot !== 'actions'));
      this._dialog = dialog;
      this.replaceChildren(dialog);

      // A click counts as on the backdrop only if it also began there, so selecting text inside
      // and letting go outside leaves the modal open.
      dialog.addEventListener('pointerdown', (e) => { this._pressedBackdrop = e.target === dialog; });
      dialog.addEventListener('click', (e) => {
        if (e.target.closest('.sb-modal__dialog') !== dialog) return; // a modal inside this one handles its own
        if (e.target === dialog && this._pressedBackdrop) return this._dismiss('backdrop');
        if (e.target.closest('.sb-modal__size')) return this._toggleSize();
        const closer = e.target.closest('[data-close]');
        if (closer) this._dismiss(closer.dataset.close || 'close');
      });
      dialog.addEventListener('cancel', (e) => {
        e.preventDefault(); // closed here instead, so the attribute and the event stay in step
        this._dismiss('escape');
      });

      this._showTitle();
      this._showSize();
      this._showOpen();
    }

    _showTitle() {
      const heading = this.getAttribute('heading');
      const title = this._dialog.querySelector('.sb-modal__title');
      title.textContent = heading ?? '';
      title.hidden = !heading;
      if (heading) this._dialog.setAttribute('aria-labelledby', title.id);
      else this._dialog.removeAttribute('aria-labelledby');
    }

    // The dialog at its size, and the size button, there only when the modal is expandable,
    // pressed while it is full size.
    _showSize() {
      const full = this.size === 'full';
      this._dialog.classList.toggle('sb-modal__dialog--full', full);
      const button = this._dialog.querySelector('.sb-modal__size');
      button.hidden = !this.hasAttribute('expandable');
      button.setAttribute('aria-pressed', full);
      button.innerHTML = full ? SHRINK_ICON : GROW_ICON;
    }

    // Opens or closes the dialog to match the open attribute. Only a dialog in the page can open,
    // and one taken out of the page and put back is no longer modal, so it is opened afresh.
    _showOpen() {
      if (this.open && this.isConnected && !this._dialog.matches(':modal')) {
        this._dialog.close();
        this._dialog.showModal();
      }
      if (!this.open) this._dialog.close();
    }

    // ---- Interaction ----

    _toggleSize() {
      this.size = this.size === 'full' ? 'default' : 'full';
      this.dispatchEvent(new CustomEvent('sb-size', { bubbles: true, detail: { size: this.size } }));
    }

    _dismiss(reason) {
      this.close();
      this.dispatchEvent(new CustomEvent('sb-close', { bubbles: true, detail: { reason } }));
    }
  }

  customElements.define('sb-modal', SbModal);
})();
