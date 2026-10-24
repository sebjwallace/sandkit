// Sandkit sb-stamp 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A status pressed onto the page like a rubber stamp: approved, received, verified, superseded.
// Ink, not a button, so it reads as an act by someone at a time, apart from what it's pressed on.
// The sandbox decides the status; a stamp the model has moved past is marked stale.
//
//   <sb-stamp label="Verified" tone="good" when="24 Oct 2026">
//     <span slot="detail">against SRC-3</span>
//   </sb-stamp>
//   stamp.stale = 'Approved at 0.3, model now 0.5';
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-stamp';
  const existing = customElements.get('sb-stamp');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-stamp>, so only one can run. Rename one by replacing every "sb-stamp" in its file.`);
    }
    return;
  }

  // Uneven ink: a fine noise used as a mask, so the ink is never quite solid.
  const NOISE = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.2 0 0 0 0.35'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>`
  )}")`;

  const CSS = `
    .sb-stamp { --sb-stamp-ink: var(--sb-text, #1f2933); display: inline-flex; flex-direction: column; align-items: center; gap: 6px; margin: 6px; vertical-align: middle; }
    .sb-stamp[tone="good"] { --sb-stamp-ink: var(--sb-good, #3f9142); }
    .sb-stamp[tone="warn"] { --sb-stamp-ink: var(--sb-warn, #d69e2e); }
    .sb-stamp[tone="bad"] { --sb-stamp-ink: var(--sb-bad, #c53030); }
    .sb-stamp__ink { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 16px; color: var(--sb-stamp-ink); font: 600 10px/1.2 var(--sb-font, system-ui, sans-serif); letter-spacing: 0.14em; text-align: center; text-transform: uppercase; }
    .sb-stamp__ink::before, .sb-stamp__ink::after { content: ''; position: absolute; border-radius: 2px; pointer-events: none; }
    .sb-stamp__ink::before { inset: 0; border: 2px solid var(--sb-stamp-ink); }
    .sb-stamp__ink::after { inset: 4px; border: 1px solid var(--sb-stamp-ink); }
    .sb-stamp__ink::before, .sb-stamp__ink::after, .sb-stamp__label, .sb-stamp__when { -webkit-mask-image: ${NOISE}; mask-image: ${NOISE}; }
    .sb-stamp__label { font-size: 14px; font-weight: 700; letter-spacing: 0.16em; margin-right: -0.16em; }
    .sb-stamp__label { display: inline-flex; align-items: center; gap: 6px; }
    .sb-stamp__icon { flex: none; width: 1.1em; height: 1.1em; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .sb-stamp__detail { max-width: 26ch; }
    .sb-stamp__who { text-transform: none; letter-spacing: normal; }
    .sb-stamp__detail:empty, .sb-stamp__who:empty { display: none; }
    .sb-stamp[shape="seal"] .sb-stamp__ink { justify-content: center; min-width: 76px; aspect-ratio: 1; padding: 18px; }
    .sb-stamp[shape="seal"] .sb-stamp__ink::before, .sb-stamp[shape="seal"] .sb-stamp__ink::after { border-radius: 50%; }
    .sb-stamp[shape="date"] .sb-stamp__when { align-self: stretch; margin: 2px -4px; padding: 3px 8px; border-block: 1px solid var(--sb-stamp-ink); font-size: 12px; }
    .sb-stamp--stale .sb-stamp__ink { opacity: 0.4; }
    .sb-stamp--stale .sb-stamp__label { text-decoration: line-through 1.5px; }
    .sb-stamp__stale { max-width: 30ch; color: var(--sb-muted, #616e7c); font: 11px/1.3 var(--sb-font, system-ui, sans-serif); text-align: center; }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // Small line icons drawn in the ink. Each tone has one unless the sandbox chooses another.
  const ICONS = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    cross: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.5v.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    question: '<path d="M9 9a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1.2-1.5 2.2v.7M12 18v.5"/>',
  };
  const TONE_ICONS = { good: 'check', bad: 'cross', warn: 'alert' };

  const iconSvg = (name) => ICONS[name]
    ? `<svg class="sb-stamp__icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`
    : '';

  function addStyle() {
    if (document.getElementById('sb-stamp-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-stamp-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbStamp extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['label', 'when', 'tone', 'shape', 'icon', 'stale'];

    constructor() {
      super();
      // Content the sandbox slots in later is moved into place as it arrives.
      this._observer = new MutationObserver(() => this._placeSlotted());
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-stamp');
      this._observer.observe(this, { childList: true });
      this.render();
    }

    disconnectedCallback() { this._observer.disconnect(); }

    attributeChangedCallback() { this.render(); }

    // ---- Public API: each mirrors its attribute ----

    get label() { return this.getAttribute('label') ?? ''; }
    set label(value) { this.setAttribute('label', value ?? ''); }

    get when() { return this.getAttribute('when') ?? ''; }
    set when(value) { this.setAttribute('when', value ?? ''); }

    get tone() { return this.getAttribute('tone') ?? 'neutral'; }
    set tone(value) { this.setAttribute('tone', value ?? 'neutral'); }

    get shape() { return this.getAttribute('shape') ?? 'rect'; }
    set shape(value) { this.setAttribute('shape', value ?? 'rect'); }

    // check, cross, alert, clock, question or none; without it, the tone's own icon.
    get icon() { return this.getAttribute('icon') ?? TONE_ICONS[this.tone] ?? 'none'; }
    set icon(value) { if (value) this.setAttribute('icon', value); else this.removeAttribute('icon'); }

    // Why the stamp no longer holds, or '' when stale without a reason; null when it still holds.
    get stale() { return this.getAttribute('stale'); }
    set stale(value) {
      if (value === null || value === undefined || value === false) this.removeAttribute('stale');
      else this.setAttribute('stale', value === true ? '' : value);
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      const slotted = [...this.querySelectorAll(':scope > [slot], :scope > .sb-stamp__ink > [data-slot] > [slot]')];
      const stale = this.stale;
      this.classList.toggle('sb-stamp--stale', stale !== null);
      this.innerHTML = `
        <span class="sb-stamp__ink">
          <span class="sb-stamp__label">${iconSvg(this.icon)}${esc(this.label)}</span>
          ${this.when ? `<span class="sb-stamp__when">${esc(this.when)}</span>` : ''}
          <span class="sb-stamp__detail" data-slot="detail"></span>
          <span class="sb-stamp__who" data-slot="who"></span>
        </span>
        ${stale !== null ? `<span class="sb-stamp__stale">${esc(stale ? `Stale: ${stale}` : 'Stale')}</span>` : ''}`;
      this.append(...slotted);
      this._placeSlotted();
    }

    _placeSlotted() {
      for (const el of this.querySelectorAll(':scope > [slot]')) {
        this.querySelector(`:scope > .sb-stamp__ink > [data-slot="${el.slot}"]`)?.append(el);
      }
    }
  }

  customElements.define('sb-stamp', SbStamp);
})();
