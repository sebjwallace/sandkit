// Sandkit sb-person 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A person as a badge: an icon in a circle, their name and their role, so whoever took part is
// recognisable wherever they appear. An agent's circle is dashed. Given a ref, pointing at a
// badge announces it page-wide, and every badge with that ref lights up together.
//
//   <sb-person ref="priya" name="Priya Shah" role="Environment agency engineer"></sb-person>
//   <sb-person ref="agent" name="Agent" role="AI assistant" agent></sb-person>
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-person';
  const existing = customElements.get('sb-person');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-person>, so only one can run. Rename one by replacing every "sb-person" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-person { display: inline-flex; vertical-align: middle; max-width: 100%; }
    .sb-person__badge { display: inline-flex; align-items: center; gap: 8px; min-width: 0; padding: 5px 12px 5px 5px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: 13px/1.25 var(--sb-font, system-ui, sans-serif); }
    .sb-person__icon { display: grid; flex: none; place-items: center; width: 30px; height: 30px; box-sizing: border-box; border: 1.5px solid var(--sb-accent, #2563eb); border-radius: 50%; background: var(--sb-accent-soft, #eaf0ff); }
    .sb-person__icon svg { width: 18px; height: 18px; fill: var(--sb-accent, #2563eb); }
    .sb-person--agent .sb-person__icon { border-style: dashed; background: var(--sb-surface, #fff); }
    .sb-person__text { display: grid; min-width: 0; }
    .sb-person__name { overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    .sb-person__role { overflow: hidden; color: var(--sb-muted, #616e7c); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .sb-person--highlighted .sb-person__badge { border-color: var(--sb-accent, #2563eb); outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }`;

  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z"/></svg>';

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const announce = (ref) => document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref } }));

  function addStyle() {
    if (document.getElementById('sb-person-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-person-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbPerson extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['name', 'role', 'ref', 'agent'];

    constructor() {
      super();
      this._onHighlight = (e) => this.classList.toggle('sb-person--highlighted', Boolean(this.ref) && e.detail?.ref === this.ref);
      this.addEventListener('pointerenter', () => { if (this.ref) announce(this.ref); });
      this.addEventListener('pointerleave', () => { if (this.ref) announce(null); });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-person');
      document.addEventListener('sb-highlight', this._onHighlight);
      this.render();
    }

    disconnectedCallback() {
      document.removeEventListener('sb-highlight', this._onHighlight);
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API: each mirrors its attribute ----

    get name() { return this.getAttribute('name') ?? ''; }
    set name(value) { this.setAttribute('name', value ?? ''); }

    get role() { return this.getAttribute('role') ?? ''; }
    set role(value) { this.setAttribute('role', value ?? ''); }

    get ref() { return this.getAttribute('ref') || null; }
    set ref(value) { if (value) this.setAttribute('ref', value); else this.removeAttribute('ref'); }

    get agent() { return this.hasAttribute('agent'); }
    set agent(value) { this.toggleAttribute('agent', Boolean(value)); }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      this.classList.toggle('sb-person--agent', this.agent);
      if (this.ref) this.dataset.ref = this.ref;
      else delete this.dataset.ref;
      const label = this.role ? `${this.name}, ${this.role}` : this.name;
      this.innerHTML = `
        <span class="sb-person__badge" title="${esc(label)}">
          <span class="sb-person__icon">${ICON}</span>
          <span class="sb-person__text">
            <span class="sb-person__name">${esc(this.name)}</span>
            ${this.role ? `<span class="sb-person__role">${esc(this.role)}</span>` : ''}
          </span>
        </span>`;
    }
  }

  customElements.define('sb-person', SbPerson);
})();
