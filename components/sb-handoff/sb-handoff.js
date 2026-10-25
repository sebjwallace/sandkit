// Sandkit sb-handoff 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// Handing something over to the agent and showing what comes back: what's been sent, Copy as
// prompt, the prompt itself on the page, and the agent's reply once the sandbox has it.
//
//   <sb-handoff heading="Ask the agent"></sb-handoff>
//   handoff.prompt = () => `# Prediction PRD-1\n\n${poll.describe()}`;
//   handoff.reply = { time: '2026-10-20T10:35', text: 'Two misses, one each way…' };
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-handoff';
  const existing = customElements.get('sb-handoff');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-handoff>, so only one can run. Rename one by replacing every "sb-handoff" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-handoff { display: grid; gap: 10px; padding: 12px 14px; border: 1px dashed var(--sb-accent, #2563eb); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 14px/1.45 var(--sb-font, system-ui, sans-serif); }
    .sb-handoff__head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
    .sb-handoff__heading { font-weight: 700; }
    .sb-handoff__status { color: var(--sb-muted, #616e7c); font-size: 13px; }
    .sb-handoff__status[data-status="answered"] { color: var(--sb-good, #3f9142); font-weight: 600; }
    .sb-handoff__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .sb-handoff__button { padding: 4px 12px; border: 1px solid var(--sb-accent, #2563eb); border-radius: var(--sb-radius, 8px); background: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #fff); font: inherit; font-size: 13px; cursor: pointer; }
    .sb-handoff__button--quiet { border-color: var(--sb-border, #d5d9e0); background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); }
    .sb-handoff__button:disabled { opacity: 0.4; cursor: default; }
    .sb-handoff__copied { color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-handoff__prompt { max-height: 260px; margin: 0; padding: 10px 12px; overflow: auto; border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace; white-space: pre-wrap; }
    .sb-handoff__reply { margin: 0; padding: 8px 12px; border-radius: var(--sb-radius, 8px); background: var(--sb-accent-soft, #eaf0ff); white-space: pre-wrap; }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // "2026-10-20T10:35" as "10:35"; anything else as given.
  const timeOf = (when) => /T\d{2}:\d{2}/.test(when ?? '') ? when.slice(11, 16) : when;

  function addStyle() {
    if (document.getElementById('sb-handoff-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-handoff-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbHandoff extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['heading', 'disabled', 'waiting-text'];

    constructor() {
      super();
      this._prompt = '';
      this._reply = null;
      this._sent = false;
      this._showing = false; // whether the prompt is shown on the page
      this._copied = null; // whether the last copy reached the clipboard: true, false, or not tried
      this._agent = null; // the sandbox's content for who replies, slotted as agent
      this.addEventListener('click', (e) => this._onClick(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-handoff');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // The prompt: text, or a function giving it, called when copied so it's always current.
    get prompt() { return this._prompt; }
    set prompt(value) { this._prompt = value ?? ''; this.render(); }

    // The agent's reply, { time, text }, once the sandbox has it; null before.
    get reply() { return this._reply; }
    set reply(value) { this._reply = value || null; this.render(); }

    // 'ready' (nothing sent yet), 'sent' (copied, no reply yet) or 'answered' (a reply is in).
    get status() { return this._reply ? 'answered' : this._sent ? 'sent' : 'ready'; }

    // Back to nothing sent, for a new round; the reply is kept until the sandbox clears it.
    reset() { this._sent = false; this._showing = false; this._copied = null; this.render(); }

    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) { this.toggleAttribute('disabled', Boolean(value)); }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      this._agent = this.querySelector(':scope > [slot="agent"]') ?? this._agent;
      const status = this.status;
      const statusText = this.disabled ? this.getAttribute('waiting-text') || 'Not ready to send yet.' : {
        ready: 'Not yet sent to the agent.',
        sent: 'Sent to the agent. Waiting for its reply.',
        answered: `Replied${this._reply?.time ? ` at ${timeOf(this._reply.time)}` : ''}.`
      }[status];
      const copied = this._copied === null ? '' : `<span class="sb-handoff__copied">${this._copied ? 'Copied. Paste it to the agent.' : 'Copy it from below.'}</span>`;
      const heading = this.getAttribute('heading');
      this.innerHTML = `
        <div class="sb-handoff__head">
          <span class="sb-handoff__who"></span>
          ${heading ? `<span class="sb-handoff__heading">${esc(heading)}</span>` : ''}
          <span class="sb-handoff__status" data-status="${status}">${esc(statusText)}</span>
        </div>
        <div class="sb-handoff__actions">
          <button type="button" class="sb-handoff__button" data-action="copy"${this.disabled ? ' disabled' : ''}>${status === 'ready' ? 'Copy as prompt' : 'Copy again'}</button>
          ${this._sent ? `<button type="button" class="sb-handoff__button sb-handoff__button--quiet" data-action="show">${this._showing ? 'Hide the prompt' : 'Show the prompt'}</button>` : ''}
          ${copied}
        </div>
        ${this._showing ? `<pre class="sb-handoff__prompt">${esc(this._text())}</pre>` : ''}
        ${this._reply ? `<p class="sb-handoff__reply">${esc(this._reply.text)}</p>` : ''}`;
      if (this._agent) this.querySelector('.sb-handoff__who').append(this._agent);
    }

    _text() { return typeof this._prompt === 'function' ? String(this._prompt() ?? '') : String(this._prompt); }

    // ---- Interaction ----

    // Copying shows the prompt on the page at once, and tries the clipboard alongside, never
    // waiting for it: a clipboard can hang when the page isn't focused.
    _onClick(e) {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'show') { this._showing = !this._showing; this.render(); }
      if (action !== 'copy' || this.disabled) return;
      const text = this._text();
      this._sent = true;
      this._showing = true;
      this._copied = null;
      this.render();
      this.dispatchEvent(new CustomEvent('sb-copy', { bubbles: true, detail: { text } }));
      const clipboard = navigator.clipboard?.writeText(text);
      if (!clipboard) return this._noteCopied(false);
      clipboard.then(() => this._noteCopied(true), () => this._noteCopied(false));
    }

    _noteCopied(ok) {
      this._copied = ok;
      this.render();
    }
  }

  customElements.define('sb-handoff', SbHandoff);
})();
