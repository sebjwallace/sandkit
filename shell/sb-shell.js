// Sandkit sb-shell 0.1.7 · MIT Licence · https://github.com/sebjwallace/sandkit
// The sandbox shell: the header and the settings dialog around a sandbox.
//
//   <sb-shell heading="My sandbox" controls="fullscreen settings collapse">
//     <p>Header content, such as the goal. Long content shows one line, with More / Less.</p>
//     <button slot="actions">Share</button>                     beside the header controls
//     <sb-comments slot="modes"></sb-comments>                  a mode, chosen in the mode picker
//     <sb-theme-settings slot="settings"></sb-theme-settings>   a section in settings
//   </sb-shell>
//
//   shell.goal = 'What the sandbox is for.';                   shown when the page gives no content
//   shell.pages = [{ href: 'index.html', title: 'Start' }];    navigation, the current page marked
//
// A sandbox sets its goal and pages once, in its own sandbox.js. An exported page's shell carries
// `exported`, `version`, `sandkit` and `page`, and says so; its other pages show as not included.
//
// Settings sections: any element can be a section, and its `heading` titles it. A section that
// also has `settingsKey`, `exportSettings()` and `importSettings(data)` is included when
// settings are exported to, or imported from, a file. The shell knows no section by name:
// the sandbox chooses which ones to include.
//
// Modes: any element with `heading` and `active` can be a mode. The picker lists them after
// Explore and turns on the one chosen, the rest off; a mode that ends or starts itself fires
// sb-mode, and the picker follows. The shell knows no mode by name.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-shell';
  const existing = customElements.get('sb-shell');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-shell>, so only one can run. Rename one by replacing every "sb-shell" in its file.`);
    }
    return;
  }

  // Header controls, in their default order.
  const DEFAULT_CONTROLS = ['fullscreen', 'settings', 'collapse'];

  const SETTINGS_FILE = { format: 'sandkit-settings', version: 1, name: 'sandbox-settings.json' };

  const CSS = `
    .sb-shell { display: block; }

    .sb-shell__bar { display: flex; align-items: flex-start; gap: 16px; padding: 14px 24px; background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-shell[collapsed] .sb-shell__bar { display: none; }
    .sb-shell__titles { flex: 1; min-width: 0; }
    .sb-shell__heading { font-size: 20px; font-weight: 700; margin: 0; }
    .sb-shell__content { margin-top: 4px; font-size: 14px; color: var(--sb-muted, #616e7c); }
    .sb-shell__content > * { margin: 0; }
    .sb-shell__content:not([data-expanded]) { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; }
    .sb-shell__more { padding: 0; border: 0; background: none; font: inherit; font-size: 13px; color: var(--sb-accent, #2563eb); cursor: pointer; }
    .sb-shell__pages { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 8px; font-size: 14px; }
    .sb-shell__pages[hidden] { display: none; }
    .sb-shell__page { color: var(--sb-accent, #2563eb); text-decoration: none; }
    .sb-shell__page:hover { text-decoration: underline; }
    .sb-shell__page[aria-current="page"] { color: var(--sb-text, #1f2933); font-weight: 600; text-decoration: underline; text-decoration-color: var(--sb-accent, #2563eb); text-decoration-thickness: 2px; text-underline-offset: 4px; }
    .sb-shell__page--excluded { color: var(--sb-muted, #616e7c); text-decoration: line-through; cursor: help; }
    .sb-shell__exported { margin: 6px 0 0; font-size: 12px; color: var(--sb-muted, #616e7c); }
    .sb-shell__exported[hidden] { display: none; }
    .sb-shell__actions, .sb-shell__controls, .sb-shell__modes { flex: none; display: flex; align-items: center; gap: 6px; }
    .sb-shell__modes[hidden] { display: none; }
    .sb-shell__mode { appearance: none; padding: 7px 30px 7px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background-color: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: inherit; font-size: 13px; cursor: pointer; }
    /* The picker's own chevron, the header's icon, set in from the edge in place of the browser's. */
    .sb-shell__picker { position: relative; display: flex; }
    .sb-shell__picker svg { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--sb-text, #1f2933); pointer-events: none; }
    .sb-shell__mode[data-on] { border-color: var(--sb-warn, #d69e2e); background-color: color-mix(in srgb, var(--sb-warn, #d69e2e) 22%, var(--sb-surface, #fff)); font-weight: 600; }
    .sb-shell__actions:empty { display: none; }

    .sb-shell__icon-button { flex: none; display: inline-flex; padding: 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); cursor: pointer; }
    .sb-shell__icon-button:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-shell__restore { position: fixed; top: 8px; right: 8px; z-index: 100; opacity: 0.6; }
    .sb-shell__restore:hover, .sb-shell__restore:focus-visible { opacity: 1; }
    .sb-shell:not([collapsed]) .sb-shell__restore { display: none; }

    .sb-shell[compact] .sb-shell__bar { position: fixed; top: 0; left: 0; right: 0; z-index: 50; align-items: center; padding: 8px 24px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15); animation: sb-shell-arrive 0.18s ease-out; }
    .sb-shell[compact] .sb-shell__heading { font-size: 16px; }
    .sb-shell[compact] :is(.sb-shell__content, .sb-shell__more, .sb-shell__pages, .sb-shell__exported) { display: none; }
    .sb-shell[compact] .sb-shell__icon-button { padding: 6px; }
    @keyframes sb-shell-arrive { from { transform: translateY(-100%); } }
    @media (prefers-reduced-motion: reduce) { .sb-shell[compact] .sb-shell__bar { animation: none; } }

    .sb-shell__dialog { width: min(440px, calc(100vw - 32px)); max-height: calc(100vh - 48px); overflow-y: auto; padding: 0; border: 1px solid var(--sb-border, #d5d9e0); border-radius: calc(var(--sb-radius, 8px) * 1.5); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font-family: var(--sb-font, system-ui, sans-serif); }
    .sb-shell__dialog::backdrop { background: rgba(0, 0, 0, 0.45); }
    .sb-shell__dialog-head { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: inherit; border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-shell__dialog-title { margin: 0; font-size: 16px; }
    .sb-shell__close { border: 0; background: none; color: var(--sb-muted, #616e7c); font-size: 22px; line-height: 1; cursor: pointer; }
    .sb-shell__section { padding: 14px 18px 18px; }
    .sb-shell__section + .sb-shell__section { border-top: 1px solid var(--sb-border, #d5d9e0); }
    .sb-shell__section-title { margin: 0 0 10px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--sb-muted, #616e7c); }
    .sb-shell__note { margin: 0 0 10px; font-size: 13px; color: var(--sb-muted, #616e7c); }
    .sb-shell__row { display: flex; flex-wrap: wrap; gap: 8px; }
    .sb-shell__button { font: inherit; font-size: 13px; padding: 5px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); cursor: pointer; }
    .sb-shell__button:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-shell__message { margin: 10px 0 0; font-size: 12px; }
    .sb-shell__message--error { color: var(--sb-bad, #c53030); }`;

  // Icon outlines (Feather, MIT), drawn in the current text colour.
  const ICON_PATHS = {
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    enterFullscreen: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
    exitFullscreen: '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',
    collapse: '<polyline points="18 15 12 9 6 15"/>',
    open: '<polyline points="6 9 12 15 18 9"/>',
    expand: '<polyline points="6 9 12 15 18 9"/>'
  };

  // ---- Helpers ----

  // Where a key press is someone typing, not a shortcut.
  const typing = (el) => el.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])');

  // Each mode's key: its own `key` attribute, or the first letter of its name. The first mode to
  // claim a letter keeps it; a later one has no key.
  function modeKeys(modes, nameOf) {
    const keys = new Map();
    for (const mode of modes) {
      const key = (mode.getAttribute('key') || nameOf(mode)[0] || '').toLowerCase();
      if (key && !keys.has(key)) keys.set(key, mode);
    }
    return keys;
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const icon = (name) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;

  function addStyle(id, css) {
    if (document.getElementById(id)) return;
    const style = Object.assign(document.createElement('style'), { id, textContent: css });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  const storage = {
    read(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* kept in memory only */ }
    }
  };

  function download(filename, data) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  }

  // A page's file name, so links match however they're written: 'pages/stock.html?x' is 'stock.html'.
  const fileName = (href) => decodeURIComponent(href.split(/[?#]/)[0].split('/').pop()) || 'index.html';

  const formatDate = (isoDate) => new Date(`${isoDate}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const hasContent = (nodes) => nodes.some((node) => node.nodeType === Node.ELEMENT_NODE || node.textContent.trim());

  // ---- The element ----

  let instanceCount = 0; // gives each shell unique ids, so several can share a page

  class SbShell extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._id = `sb-shell-${++instanceCount}`;
      this._onFullscreenChange = () => this._showFullscreenState();
      this._onScroll = () => this._followScroll();
      this._onResize = () => { this._measureCompact(); this._followScroll(); };
      this._onKey = (e) => this._modeKey(e);
    }

    connectedCallback() {
      addStyle('sb-shell-style', CSS);
      this.classList.add('sb-shell');
      document.addEventListener('fullscreenchange', this._onFullscreenChange);
      addEventListener('scroll', this._onScroll, { passive: true });
      addEventListener('resize', this._onResize);
      document.addEventListener('keydown', this._onKey);
      if (this._built) return;
      // The shell takes its children as header content, so wait until they have been parsed.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      } else {
        this._build();
      }
    }

    disconnectedCallback() {
      document.removeEventListener('fullscreenchange', this._onFullscreenChange);
      removeEventListener('scroll', this._onScroll);
      removeEventListener('resize', this._onResize);
      document.removeEventListener('keydown', this._onKey);
      this._setCompact(false);
      document.documentElement.style.scrollPaddingTop = '';
    }

    // ---- Public API ----

    get heading() { return this.getAttribute('heading') || document.title; }
    set heading(text) {
      this.setAttribute('heading', text);
      const element = this.querySelector('.sb-shell__heading');
      if (element) element.textContent = this.heading;
    }

    // The sandbox's goal, shown as header content when the page gives none of its own.
    get goal() { return this._goal ?? ''; }
    set goal(text) {
      this._goal = text;
      this._showGoal();
    }

    // The sandbox's pages, [{ href, title }], shown as navigation with the current page marked.
    get pages() { return this._pages ?? []; }
    set pages(list) {
      this._pages = list || [];
      this._showPages();
    }

    // Collapsing hides the header behind a small button that brings it back. Remembered per viewer.
    get collapsed() { return this.hasAttribute('collapsed'); }
    set collapsed(value) {
      this.toggleAttribute('collapsed', Boolean(value));
      storage.write('sb-shell-collapsed', this.collapsed);
      this._measureCompact();
      this._followScroll();
      this.dispatchEvent(new CustomEvent('sb-collapse', { bubbles: true, detail: { collapsed: this.collapsed } }));
    }

    // Whether the header is showing compact at the top of the window, the page having scrolled past it.
    get compact() { return this.hasAttribute('compact'); }

    toggleFullscreen() {
      // Browsers may refuse full screen (e.g. in some embedded previews); the page simply stays as it is.
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    }

    openSettings() { this._dialog?.showModal(); }
    closeSettings() { this._dialog?.close(); }

    // Every saveable section's settings, as written to a settings file.
    get settings() {
      const sections = {};
      for (const section of this._savableSections()) sections[section.settingsKey] = section.exportSettings();
      return { format: SETTINGS_FILE.format, version: SETTINGS_FILE.version, sections };
    }

    importSettings(settings) {
      if (settings?.format !== SETTINGS_FILE.format) throw new Error('This file is not a Sandkit settings file.');
      for (const section of this._savableSections()) {
        const data = settings.sections?.[section.settingsKey];
        if (data) section.importSettings(data);
      }
    }

    // ---- Building ----

    _build() {
      if (this._built) return; // a shell moved while the page loads is asked twice
      this._built = true;
      const { content, actions, sections, modes } = this._takeChildren();
      this._restoreCollapsed();

      this.innerHTML = `
        <header class="sb-shell__bar">
          <div class="sb-shell__titles">
            <h1 class="sb-shell__heading">${esc(this.heading)}</h1>
            <nav class="sb-shell__pages" aria-label="Pages" hidden></nav>
            <p class="sb-shell__exported" hidden></p>
          </div>
          <div class="sb-shell__modes" data-modes hidden><span class="sb-shell__picker"><select class="sb-shell__mode" aria-label="Mode"></select>${icon('open')}</span></div>
          <div class="sb-shell__actions"></div>
          <div class="sb-shell__controls">${this._controlButtons()}</div>
        </header>
        <button type="button" class="sb-shell__icon-button sb-shell__restore" data-action="expand" aria-label="Show header" title="Show header">${icon('expand')}</button>
        <dialog class="sb-shell__dialog" aria-labelledby="${this._id}-title">
          <div class="sb-shell__dialog-head">
            <h2 class="sb-shell__dialog-title" id="${this._id}-title">Settings</h2>
            <button type="button" class="sb-shell__close" data-action="close-settings" aria-label="Close">×</button>
          </div>
          <section class="sb-shell__section sb-shell__section--file">
            <h3 class="sb-shell__section-title">Your settings</h3>
            <p class="sb-shell__note">Keep a copy of your settings, or share them, as a JSON file.</p>
            <div class="sb-shell__row">
              <button type="button" class="sb-shell__button" data-action="export-settings">Export…</button>
              <button type="button" class="sb-shell__button" data-action="import-settings">Import…</button>
              <input type="file" accept=".json,application/json" hidden>
            </div>
            <p class="sb-shell__message" role="status" hidden></p>
          </section>
        </dialog>`;

      this._dialog = this.querySelector('dialog');
      this._sections = [];
      this._fileInput = this.querySelector('input[type=file]');
      this.querySelector('.sb-shell__actions').append(...actions);
      this._hasOwnContent = content.length > 0;
      if (this._hasOwnContent) this._addContent(content);
      this._showGoal();
      this._showPages();
      this._showExported();
      sections.forEach((section) => this._addSection(section));
      this._addModes(modes);

      this.addEventListener('click', (e) => this._onClick(e));
      this.addEventListener('sb-mode', (e) => this._followMode(e));
      this._fileInput.addEventListener('change', () => this._importFile(this._fileInput.files[0]));
      this._showFullscreenState();
      this._measureCompact();
      this._followScroll();
    }

    // Sorts the shell's children by slot: actions, settings sections, and header content.
    _takeChildren() {
      const slotted = (name) => [...this.querySelectorAll(`:scope > [slot="${name}"]`)];
      const actions = slotted('actions');
      const sections = slotted('settings');
      const modes = slotted('modes');
      const placed = [...actions, ...sections, ...modes];
      placed.forEach((el) => el.removeAttribute('slot'));
      const rest = [...this.childNodes].filter((node) => !placed.includes(node));
      return { content: hasContent(rest) ? rest : [], actions, sections, modes };
    }

    _restoreCollapsed() {
      const stored = storage.read('sb-shell-collapsed', null);
      if (stored !== null) this.toggleAttribute('collapsed', stored);
    }

    _controlButtons() {
      const buttons = {
        fullscreen: document.fullscreenEnabled ? `<button type="button" class="sb-shell__icon-button" data-action="fullscreen"></button>` : '',
        settings: `<button type="button" class="sb-shell__icon-button" data-action="open-settings" aria-label="Settings" title="Settings">${icon('settings')}</button>`,
        collapse: `<button type="button" class="sb-shell__icon-button" data-action="collapse" aria-label="Hide header" title="Hide header">${icon('collapse')}</button>`
      };
      const wanted = this.getAttribute('controls')?.split(/\s+/) ?? DEFAULT_CONTROLS;
      return wanted.map((name) => buttons[name] ?? '').join('');
    }

    // ---- Compact while scrolled ----

    // Once the full header has scrolled out of view, a compact one stays at the top of the window.
    // The full one keeps its place on the page meanwhile, so nothing below it moves.
    _followScroll() {
      if (!this._built) return;
      this._setCompact(!this.collapsed && this.getBoundingClientRect().bottom <= 0);
    }

    _setCompact(on) {
      if (on === this.compact) return;
      if (on) this.style.minHeight = `${this.offsetHeight}px`;
      this.toggleAttribute('compact', on);
      if (!on) this.style.minHeight = '';
      // For whatever else sticks to the top of the window, such as a notebook's outline.
      document.documentElement.style.setProperty('--sb-header-height', on ? `${this._compactHeight}px` : '0px');
    }

    // The compact header's height, measured without showing it, so a jump to any part of the page
    // lands below it, wherever the page was.
    _measureCompact() {
      if (!this._built) return;
      if (this.collapsed) { document.documentElement.style.scrollPaddingTop = ''; return; }
      const was = this.compact;
      this.toggleAttribute('compact', true);
      this._compactHeight = this.querySelector('.sb-shell__bar').offsetHeight;
      this.toggleAttribute('compact', was);
      document.documentElement.style.scrollPaddingTop = `${this._compactHeight}px`;
    }

    // ---- Header content ----

    // Long content shows one line, with More / Less to reveal the rest.
    _addContent(nodes) {
      const content = Object.assign(document.createElement('div'), { className: 'sb-shell__content' });
      const more = Object.assign(document.createElement('button'), { type: 'button', className: 'sb-shell__more', hidden: true });
      more.dataset.action = 'toggle-content';
      content.append(...nodes);
      this.querySelector('.sb-shell__heading').after(content, more);
      this._content = { element: content, more };
      new ResizeObserver(() => this._showContentState()).observe(content);
    }

    // The goal fills the header content only when the page has none of its own.
    _showGoal() {
      if (!this._built || this._hasOwnContent || !this.goal) return;
      if (!this._content) this._addContent([document.createElement('p')]);
      this._content.element.firstChild.innerHTML = `<strong>Goal:</strong> ${esc(this.goal)}`;
    }

    // ---- Pages ----

    // The current page is named by the `page` attribute, or else by the address.
    get _currentPage() { return this.getAttribute('page') || fileName(location.pathname); }

    // A single page needs no navigation. In an exported file only the current page is included,
    // so the others aren't links.
    _showPages() {
      const nav = this.querySelector('.sb-shell__pages');
      if (!nav) return;
      const exported = this.hasAttribute('exported');
      nav.hidden = this.pages.length < 2;
      nav.innerHTML = this.pages.map(({ href, title }) => {
        if (fileName(href) === this._currentPage) return `<span class="sb-shell__page" aria-current="page">${esc(title)}</span>`;
        if (exported) return `<span class="sb-shell__page sb-shell__page--excluded" title="Not included in this export">${esc(title)}</span>`;
        return `<a class="sb-shell__page" href="${esc(href)}">${esc(title)}</a>`;
      }).join('');
    }

    // "Exported 18 Oct 2026 · version 0.4.0 · Sandkit 0.2.27", from the attributes the export tool sets.
    _showExported() {
      const note = this.querySelector('.sb-shell__exported');
      const exported = this.getAttribute('exported');
      const version = this.getAttribute('version');
      const sandkit = this.getAttribute('sandkit');
      note.hidden = !exported;
      if (exported) note.textContent = [`Exported ${formatDate(exported)}`, version && `version ${version}`, sandkit && `Sandkit ${sandkit}`].filter(Boolean).join(' · ');
    }

    _toggleContent() {
      this._content.element.toggleAttribute('data-expanded');
      this._showContentState();
    }

    _showContentState() {
      const { element, more } = this._content;
      const expanded = element.hasAttribute('data-expanded');
      more.hidden = !expanded && element.scrollHeight <= element.clientHeight;
      more.textContent = expanded ? 'Less' : 'More';
      more.setAttribute('aria-expanded', String(expanded));
    }

    // ---- Header controls ----

    _showFullscreenState() {
      const button = this.querySelector('[data-action="fullscreen"]');
      if (!button) return;
      const isFullscreen = Boolean(document.fullscreenElement);
      const label = isFullscreen ? 'Exit full screen' : 'Full screen';
      button.innerHTML = icon(isFullscreen ? 'exitFullscreen' : 'enterFullscreen');
      button.setAttribute('aria-label', label);
      button.title = label;
    }

    // Focus follows the header, so keyboard users never lose their place.
    _collapse() {
      this.collapsed = true;
      this.querySelector('.sb-shell__restore').focus();
    }

    _expand() {
      this.collapsed = false;
      this.querySelector('[data-action="collapse"]')?.focus();
    }

    // ---- Modes ----

    // Explore, then each mode by its heading and key. The modes sit beside the picker, drawing their own banners.
    _addModes(modes) {
      this._modes = modes;
      const picker = this.querySelector('.sb-shell__modes');
      const select = picker.querySelector('select');
      modes.forEach((mode) => customElements.upgrade(mode)); // their heading and active are needed now
      this._modeKeys = modeKeys(modes, (mode) => this._modeName(mode));
      const keyOf = (mode) => [...this._modeKeys].find(([, m]) => m === mode)?.[0];
      const label = (mode) => this._modeName(mode) + (keyOf(mode) ? ` · ${keyOf(mode).toUpperCase()}` : '');
      select.innerHTML = `<option value="">Explore</option>` + modes.map((mode, i) => `<option value="${i}">${esc(label(mode))}</option>`).join('');
      select.title = `Keys: ${[...this._modeKeys].map(([key, mode]) => `${key.toUpperCase()} ${this._modeName(mode)}`).join(', ')}. The same key again, or Esc, to explore.`;
      select.addEventListener('change', () => this._pickMode(this._modes[select.value] ?? null));
      picker.append(...modes);
      picker.hidden = modes.length === 0;
    }

    // The viewer chose a mode, or Explore: one mode at a time. Listeners hear which mode started,
    // or which ended for Explore; a mode that refused to start changes nothing.
    _pickMode(chosen) {
      const was = this._activeMode();
      for (const mode of this._modes) if (mode !== chosen && mode.active) mode.active = false;
      if (chosen) chosen.active = true;
      this._showMode();
      const now = this._activeMode();
      if (now === was) return;
      const detail = now ? { mode: this._modeName(now), active: true } : { mode: this._modeName(was), active: false };
      this.dispatchEvent(new CustomEvent('sb-mode', { bubbles: true, detail }));
    }

    // A mode ended itself, from its own banner, or started itself again: the picker follows.
    _followMode(e) {
      if (!this._modes.includes(e.target)) return;
      if (e.detail.active) for (const mode of this._modes) if (mode !== e.target && mode.active) mode.active = false;
      this._showMode();
    }

    _showMode() {
      const select = this.querySelector('.sb-shell__mode');
      const on = this._modes.findIndex((mode) => mode.active);
      select.value = on < 0 ? '' : String(on);
      select.toggleAttribute('data-on', on >= 0);
    }

    // A mode's key turns it on, or back to Explore if it's on. Not while typing, with Ctrl, ⌘ or Alt,
    // or when something on the page has already used the key.
    _modeKey(e) {
      if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      const mode = this._modeKeys?.get(e.key.toLowerCase());
      if (!mode) return;
      e.preventDefault();
      this._pickMode(mode.active ? null : mode);
    }

    _activeMode() { return this._modes.find((mode) => mode.active) ?? null; }

    _modeName(mode) { return mode.getAttribute('heading') || mode.heading; }

    // ---- Settings ----

    _addSection(element) {
      this._sections.push(element);
      const section = Object.assign(document.createElement('section'), { className: 'sb-shell__section' });
      customElements.upgrade(element); // a custom element section may not be upgraded yet; its API is needed now
      const heading = element.getAttribute('heading') || element.heading;
      if (heading) section.innerHTML = `<h3 class="sb-shell__section-title">${esc(heading)}</h3>`;
      section.append(element);
      this.querySelector('.sb-shell__section--file').before(section);
    }

    _savableSections() {
      return this._sections.filter((s) => s.settingsKey && s.exportSettings && s.importSettings);
    }

    async _importFile(file) {
      if (!file) return;
      try {
        this.importSettings(JSON.parse(await file.text()));
        this._showMessage(`Imported settings from ${file.name}.`);
      } catch (err) {
        this._showMessage(err instanceof SyntaxError ? 'That file is not valid JSON.' : err.message, { isError: true });
      }
      this._fileInput.value = '';
    }

    _showMessage(text, { isError = false } = {}) {
      const message = this.querySelector('.sb-shell__message');
      message.textContent = text;
      message.classList.toggle('sb-shell__message--error', isError);
      message.hidden = false;
    }

    // ---- Events ----

    _onClick(e) {
      // A click on the dialog's backdrop lands on the dialog element itself.
      if (e.target === this._dialog) return this.closeSettings();
      // Sections handle their own buttons.
      if (this._sections.some((section) => section.contains(e.target))) return;
      const action = e.target.closest('[data-action]')?.dataset.action;
      switch (action) {
        case 'collapse': return this._collapse();
        case 'expand': return this._expand();
        case 'fullscreen': return this.toggleFullscreen();
        case 'toggle-content': return this._toggleContent();
        case 'open-settings': return this.openSettings();
        case 'close-settings': return this.closeSettings();
        case 'export-settings': return download(SETTINGS_FILE.name, this.settings);
        case 'import-settings': return this._fileInput.click();
      }
    }
  }

  customElements.define('sb-shell', SbShell);
})();
