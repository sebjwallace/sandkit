// Sandkit sb-export 0.1.7 · MIT Licence · https://github.com/sebjwallace/sandkit
// An Export button for the shell's header. Pages can't read their own files when opened from the
// computer, so exporting is the agent's job: the button says what exporting gives, offers the
// options, and writes the prompt asking the agent for it, ready to copy.
//
//   <sb-shell><sb-export slot="actions"></sb-export></sb-shell>
//
// In an exported file it hides: there's nothing left to export from.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-export';
  const existing = customElements.get('sb-export');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-export>, so only one can run. Rename one by replacing every "sb-export" in its file.`);
    }
    return;
  }

  const CLIPBOARD_WAIT_MS = 500;

  const CSS = `
    .sb-export__button { display: inline-flex; padding: 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); cursor: pointer; }
    .sb-export__button:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-export__dialog { width: min(520px, calc(100vw - 32px)); padding: 0; border: 1px solid var(--sb-border, #d5d9e0); border-radius: calc(var(--sb-radius, 8px) * 1.5); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 14px/1.5 var(--sb-font, system-ui, sans-serif); }
    .sb-export__dialog::backdrop { background: rgba(0, 0, 0, 0.45); }
    .sb-export__head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-export__title { margin: 0; font-size: 16px; }
    .sb-export__close { border: 0; background: none; color: var(--sb-muted, #616e7c); font-size: 22px; line-height: 1; cursor: pointer; }
    .sb-export__body { padding: 14px 18px 18px; }
    .sb-export__body p { margin: 0 0 10px; }
    .sb-export__option { display: flex; gap: 8px; align-items: baseline; margin: 0 0 12px; cursor: pointer; }
    .sb-export__prompt { box-sizing: border-box; width: 100%; min-height: 120px; padding: 8px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: inherit; font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace; resize: vertical; }
    .sb-export__row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
    .sb-export__copy { font: inherit; font-size: 13px; padding: 5px 12px; border: 1px solid var(--sb-accent, #2563eb); border-radius: var(--sb-radius, 8px); background: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #fff); cursor: pointer; }
    .sb-export__status { font-size: 13px; color: var(--sb-muted, #616e7c); }`;

  // Feather's "download" outline (MIT).
  const ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const pageName = () => decodeURIComponent(location.pathname.split('/').pop()) || 'index.html';

  // What to ask the agent, worded for the options chosen.
  function exportPrompt(page, { images }) {
    const flags = images ? '' : ' --no-images';
    return [
      `Export ${page} from this sandbox as one standalone HTML file${images ? '' : ', leaving out its images'}.`,
      `From the sandbox folder, run: node lib/sandkit/tools/export.mjs ${page}${flags}`,
      `Then tell me where it saved, list every file that went in with its size, and pass on any warnings.`
    ].join('\n');
  }

  class SbExport extends HTMLElement {
    static origin = ORIGIN;

    connectedCallback() {
      if (this._built) return;
      this._built = true;
      if (!document.getElementById('sb-export-style')) {
        document.head.prepend(Object.assign(document.createElement('style'), { id: 'sb-export-style', textContent: CSS }));
      }
      const page = pageName();
      this.innerHTML = `
        <button type="button" class="sb-export__button" aria-label="Export this page" title="Export this page">${ICON}</button>
        <dialog class="sb-export__dialog" aria-label="Export this page">
          <div class="sb-export__head">
            <h2 class="sb-export__title">Export this page</h2>
            <button type="button" class="sb-export__close" aria-label="Close">×</button>
          </div>
          <div class="sb-export__body">
            <p>Share this page as one HTML file that runs anywhere: open it, email it or put it on a website. Only this page goes in; the others aren't included.</p>
            <p>Ask the agent you build the sandbox with to export it, with this prompt. It saves to <code>export/${esc(page)}</code> in the sandbox folder.</p>
            <label class="sb-export__option"><input type="checkbox" name="images" checked> Include images</label>
            <textarea class="sb-export__prompt" readonly aria-label="Prompt for your agent"></textarea>
            <div class="sb-export__row">
              <button type="button" class="sb-export__copy">Copy prompt</button>
              <span class="sb-export__status" role="status"></span>
            </div>
          </div>
        </dialog>`;
      this._dialog = this.querySelector('dialog');
      this._promptArea = this.querySelector('.sb-export__prompt');
      this._status = this.querySelector('.sb-export__status');
      this.querySelector('.sb-export__button').addEventListener('click', () => this.open());
      this.querySelector('.sb-export__close').addEventListener('click', () => this._dialog.close());
      this.querySelector('.sb-export__copy').addEventListener('click', () => this._copy());
      this._dialog.addEventListener('click', (e) => { if (e.target === this._dialog) this._dialog.close(); }); // the backdrop
      this._dialog.addEventListener('change', () => this._showPrompt());
      this._showPrompt();
      if (document.querySelector('sb-shell[exported]')) this.hidden = true;
    }

    // The prompt, as worded for the options now chosen.
    get prompt() {
      return exportPrompt(pageName(), { images: this.querySelector('input[name="images"]').checked });
    }

    open() {
      this._status.textContent = '';
      this._dialog.showModal();
    }

    _showPrompt() {
      this._promptArea.value = this.prompt;
      this._status.textContent = '';
    }

    // Copies the prompt, or selects it to copy by hand where the clipboard is refused, or doesn't
    // answer in time (as when a permission prompt waits unseen).
    async _copy() {
      const noAnswer = new Promise((_, reject) => setTimeout(reject, CLIPBOARD_WAIT_MS));
      try {
        await Promise.race([navigator.clipboard.writeText(this.prompt), noAnswer]);
        this._status.textContent = 'Copied. Paste it to your agent.';
      } catch {
        this._promptArea.select();
        this._status.textContent = 'Press Ctrl+C (⌘C on a Mac) to copy it.';
      }
    }
  }

  customElements.define('sb-export', SbExport);
})();
