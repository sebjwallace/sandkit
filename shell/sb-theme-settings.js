// Sandkit sb-theme-settings 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Theming for a sandbox: the theme tokens, the viewer's chosen theme and saved presets,
// and a Theme section for the shell's settings:
//
//   <sb-shell><sb-theme-settings slot="settings"></sb-theme-settings></sb-shell>
//
// Loading this script applies the viewer's theme straight away, so the page never flashes the
// wrong one. Load it in <head>.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-theme-settings';
  const existing = customElements.get('sb-theme-settings');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-theme-settings>, so only one can run. Rename one by replacing every "sb-theme-settings" in its file.`);
    }
    return;
  }

  // ---- Tokens and built-in themes ----
  // Components read these tokens, each with its own fallback for pages without theming.
  // A theme is a set of token values under [data-theme="..."]. Sandboxes add their own the same way.

  const THEMES_CSS = `
    :root, [data-theme="light"] {
      color-scheme: light;
      --sb-bg: #f5f6f8; --sb-surface: #ffffff; --sb-surface-2: #eef0f3;
      --sb-text: #1f2933; --sb-muted: #616e7c; --sb-border: #d5d9e0;
      --sb-accent: #2563eb; --sb-accent-text: #ffffff; --sb-accent-soft: #eaf0ff;
      --sb-good: #3f9142; --sb-warn: #d69e2e; --sb-bad: #c53030;
      --sb-font: system-ui, -apple-system, "Segoe UI", sans-serif; --sb-radius: 8px;
    }
    [data-theme="dark"] {
      color-scheme: dark;
      --sb-bg: #0f1419; --sb-surface: #1a2028; --sb-surface-2: #252d38;
      --sb-text: #e6e9ef; --sb-muted: #9aa5b4; --sb-border: #334050;
      --sb-accent: #5b9cff; --sb-accent-text: #0b1220; --sb-accent-soft: #1c2a44;
      --sb-good: #4fb36b; --sb-warn: #e0a83a; --sb-bad: #ef5b5b;
    }`;

  const BUILT_IN_THEMES = [
    { id: 'auto', label: 'Match system' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' }
  ];

  // The tokens a viewer can customise, in the order shown.
  const TOKENS = [
    { name: 'bg', label: 'Background', type: 'color' },
    { name: 'surface', label: 'Panels', type: 'color' },
    { name: 'surface-2', label: 'Subtle fill', type: 'color' },
    { name: 'text', label: 'Text', type: 'color' },
    { name: 'muted', label: 'Muted text', type: 'color' },
    { name: 'border', label: 'Borders', type: 'color' },
    { name: 'accent', label: 'Accent', type: 'color' },
    { name: 'accent-text', label: 'Text on accent', type: 'color' },
    { name: 'accent-soft', label: 'Accent tint', type: 'color' },
    { name: 'good', label: 'Good', type: 'color' },
    { name: 'warn', label: 'Warning', type: 'color' },
    { name: 'bad', label: 'Problem', type: 'color' },
    { name: 'font', label: 'Font', type: 'font' },
    { name: 'radius', label: 'Corner radius', type: 'radius' }
  ];

  const FONTS = [
    { label: 'System', value: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
    { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
    { label: 'Rounded', value: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif' },
    { label: 'Monospace', value: 'ui-monospace, Menlo, Consolas, monospace' }
  ];

  const STORAGE_KEYS = { choice: 'sb-theme', presets: 'sb-theme-presets' };

  // ---- Helpers ----

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle(id, css) {
    if (document.getElementById(id)) return;
    const style = Object.assign(document.createElement('style'), { id, textContent: css });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // Browser storage can be unavailable (private windows, strict file:// settings).
  // Settings then last for the visit, and can still be exported.
  const storage = {
    read(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* kept in memory only */ }
    }
  };

  // ---- Theme state ----
  // The single source of truth for the page's theme. Every change re-applies the theme and
  // announces it with an `sb-theme` event on `document`, which anything (including canvas
  // components) can listen for.
  //
  //   choice   what the viewer picked: a theme id, 'auto', or a preset id
  //   presets  viewer-made themes: { id, label, base, tokens }, a base theme plus the tokens that differ
  //   draft    unsaved token edits, shown live on top of the current choice

  const systemDark = matchMedia('(prefers-color-scheme: dark)');

  const theme = {
    choice: storage.read(STORAGE_KEYS.choice, 'auto'),
    presets: storage.read(STORAGE_KEYS.presets, []),
    draft: null,

    findPreset(id) {
      return this.presets.find((p) => p.id === id);
    },

    // The built-in or sandbox theme underneath a choice.
    baseOf(id) {
      if (this.findPreset(id)) return this.findPreset(id).base;
      if (id === 'auto') return systemDark.matches ? 'dark' : 'light';
      return id;
    },

    choose(id) {
      this.choice = id;
      this.draft = null;
      storage.write(STORAGE_KEYS.choice, id);
      this.apply();
    },

    preview(token, value) {
      this.draft = { ...this.draft, [token]: value };
      this.apply();
    },

    discardDraft() {
      this.draft = null;
      this.apply();
    },

    saveAsPreset(label) {
      const preset = {
        id: 'preset-' + Date.now().toString(36),
        label: label || `Custom theme ${this.presets.length + 1}`,
        base: this.baseOf(this.choice),
        tokens: { ...this.findPreset(this.choice)?.tokens, ...this.draft }
      };
      this._setPresets(this.presets.concat(preset));
      this.choose(preset.id);
    },

    updateCurrentPreset() {
      const preset = this.findPreset(this.choice);
      preset.tokens = { ...preset.tokens, ...this.draft };
      this._setPresets(this.presets);
      this.choose(preset.id);
    },

    deletePreset(id) {
      this._setPresets(this.presets.filter((p) => p.id !== id));
      if (this.choice === id) this.choose('auto');
      else this.apply();
    },

    // Imported presets replace any with the same id.
    merge({ choice, presets = [] }) {
      const incoming = presets.map((p) => p.id);
      this._setPresets(this.presets.filter((p) => !incoming.includes(p.id)).concat(presets));
      this.choose(choice ?? this.choice);
    },

    // Presets apply inline on <html>, so they win over the base theme.
    apply() {
      const root = document.documentElement;
      const base = this.baseOf(this.choice);
      root.setAttribute('data-theme', base);
      TOKENS.forEach((t) => root.style.removeProperty(`--sb-${t.name}`));
      const overrides = { ...this.findPreset(this.choice)?.tokens, ...this.draft };
      Object.entries(overrides).forEach(([name, value]) => root.style.setProperty(`--sb-${name}`, value));
      document.dispatchEvent(new CustomEvent('sb-theme', { detail: { choice: this.choice, theme: base } }));
    },

    _setPresets(list) {
      this.presets = list;
      storage.write(STORAGE_KEYS.presets, list);
    }
  };

  if (theme.choice.startsWith('preset-') && !theme.findPreset(theme.choice)) theme.choice = 'auto';
  addStyle('sb-themes', THEMES_CSS);
  theme.apply();
  systemDark.addEventListener('change', () => { if (theme.choice === 'auto') theme.apply(); });

  // ---- The Theme settings section ----

  const CSS = `
    sb-theme-settings { display: block; }
    .sb-theme-settings__list { display: grid; gap: 6px; margin-bottom: 10px; }
    .sb-theme-settings__option { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); cursor: pointer; font-size: 14px; }
    .sb-theme-settings__option:has(input:checked) { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent-soft, #eaf0ff); }
    .sb-theme-settings__option input { accent-color: var(--sb-accent, #2563eb); margin: 0; }
    .sb-theme-settings__swatch { margin-left: auto; display: inline-flex; gap: 3px; padding: 4px; border-radius: 6px; background: var(--sb-bg); border: 1px solid var(--sb-border); }
    .sb-theme-settings__swatch i { width: 12px; height: 12px; border-radius: 3px; }
    .sb-theme-settings__delete { border: 0; background: none; color: var(--sb-muted, #616e7c); font-size: 18px; line-height: 1; padding: 0 2px; cursor: pointer; }
    .sb-theme-settings__delete:hover { color: var(--sb-bad, #c53030); }

    .sb-theme-settings__button { font: inherit; font-size: 13px; padding: 5px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); cursor: pointer; }
    .sb-theme-settings__button:hover { background: var(--sb-surface-2, #eef0f3); }
    .sb-theme-settings__button--primary { background: var(--sb-accent, #2563eb); border-color: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #fff); }
    .sb-theme-settings__button--primary:hover { background: var(--sb-accent, #2563eb); filter: brightness(1.08); }

    .sb-theme-settings__editor { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--sb-border, #d5d9e0); }
    .sb-theme-settings__tokens { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; font-size: 13px; margin-bottom: 14px; }
    .sb-theme-settings__token { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .sb-theme-settings__token--wide { grid-column: 1 / -1; }
    .sb-theme-settings__token input[type=color] { width: 34px; height: 24px; padding: 0; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 4px; background: none; cursor: pointer; }
    .sb-theme-settings__token select { font: inherit; padding: 3px 4px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); }
    .sb-theme-settings__token input[type=range] { flex: 1; max-width: 200px; accent-color: var(--sb-accent, #2563eb); }
    .sb-theme-settings__save { display: flex; flex-wrap: wrap; gap: 8px; }
    .sb-theme-settings__name { flex: 1 1 100%; font: inherit; font-size: 13px; padding: 6px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-bg, #f5f6f8); color: var(--sb-text, #1f2933); }
    .sb-theme-settings__unsaved { flex: 1 1 100%; font-size: 12px; color: var(--sb-warn, #d69e2e); }`;

  // A small preview of a theme: its panel, text and accent colours.
  function swatch(base, tokens = {}) {
    const overrides = Object.entries(tokens).map(([name, value]) => `--sb-${name}: ${value}`).join('; ');
    return `
      <span class="sb-theme-settings__swatch" data-theme="${esc(base)}" style="${esc(overrides)}">
        <i style="background: var(--sb-surface)"></i><i style="background: var(--sb-text)"></i><i style="background: var(--sb-accent)"></i>
      </span>`;
  }

  // <input type="color"> only accepts #rrggbb, so normalise whatever a theme uses.
  function toHex(color) {
    if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
    const probe = document.createElement('span');
    probe.style.color = color;
    document.body.append(probe);
    const [r, g, b] = getComputedStyle(probe).color.match(/\d+/g).map(Number);
    probe.remove();
    return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
  }

  function tokenInput(token, value) {
    if (token.type === 'color') {
      return `<input type="color" data-token="${token.name}" value="${toHex(value)}">`;
    }
    if (token.type === 'radius') {
      return `<input type="range" min="0" max="16" data-token="radius" data-unit="px" value="${parseInt(value, 10) || 0}">`;
    }
    const options = FONTS.map((f) => `<option value="${esc(f.value)}" ${f.value === value ? 'selected' : ''}>${f.label}</option>`);
    if (!FONTS.some((f) => f.value === value)) options.unshift(`<option value="${esc(value)}" selected>Theme default</option>`);
    return `<select data-token="font">${options.join('')}</select>`;
  }

  let instanceCount = 0; // gives each section its own radio group, so several can share a page

  // Implements the shell's settings section protocol: `heading`, `settingsKey`,
  // `exportSettings()` and `importSettings(data)`.
  class SbThemeSettings extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._radioName = `sb-theme-choice-${++instanceCount}`;
      this._themes = BUILT_IN_THEMES;
      this._onThemeChange = () => this._render();
    }

    get heading() { return this.getAttribute('heading') || 'Theme'; }
    get settingsKey() { return 'theme'; }
    exportSettings() { return { choice: theme.choice, presets: theme.presets }; }
    importSettings(data) { theme.merge(data); }

    // The themes on offer. A sandbox adds its own (defined in its stylesheet) with:
    //   themeSettings.themes = themeSettings.themes.concat([{ id: 'sepia', label: 'Sepia' }])
    get themes() { return this._themes; }
    set themes(list) {
      this._themes = list;
      this._render();
    }

    connectedCallback() {
      addStyle('sb-theme-settings-style', CSS);
      document.addEventListener('sb-theme', this._onThemeChange);
      if (!this._built) this._build();
      this._render();
    }

    disconnectedCallback() {
      document.removeEventListener('sb-theme', this._onThemeChange);
    }

    _build() {
      this._built = true;
      this.innerHTML = `
        <div class="sb-theme-settings__list"></div>
        <button type="button" class="sb-theme-settings__button" data-action="customise" aria-expanded="false">Customise…</button>
        <div class="sb-theme-settings__editor" hidden></div>`;
      this._list = this.querySelector('.sb-theme-settings__list');
      this._editor = this.querySelector('.sb-theme-settings__editor');

      this.addEventListener('click', (e) => this._onClick(e));
      this.addEventListener('change', (e) => {
        if (e.target.closest('.sb-theme-settings__list')) theme.choose(e.target.value);
      });
      this.addEventListener('input', (e) => {
        const { token, unit = '' } = e.target.dataset;
        if (token) theme.preview(token, e.target.value + unit);
      });
    }

    _onClick(e) {
      const button = e.target.closest('[data-action]');
      if (!button) return;
      switch (button.dataset.action) {
        case 'customise': return this._toggleEditor(button);
        case 'save': return theme.saveAsPreset(this.querySelector('.sb-theme-settings__name').value.trim());
        case 'update': return theme.updateCurrentPreset();
        case 'discard': return theme.discardDraft();
        case 'delete':
          e.preventDefault(); // the button sits inside a label; don't also select that theme
          return theme.deletePreset(button.dataset.id);
      }
    }

    // Re-renders after any theme change. While the viewer is previewing edits, the editor is
    // left alone, so a colour picker isn't replaced mid-drag.
    _render() {
      if (!this._built) return;
      this._renderList();
      const previewing = theme.draft && this._editorChoice === theme.choice;
      if (previewing) this._showDraftState();
      else this._renderEditor();
    }

    _renderList() {
      const builtIn = this._themes.map((t) => `
        <label class="sb-theme-settings__option">
          <input type="radio" name="${this._radioName}" value="${esc(t.id)}"> ${esc(t.label)}
          ${t.id === 'auto' ? '' : swatch(t.id)}
        </label>`);
      const saved = theme.presets.map((p) => `
        <label class="sb-theme-settings__option">
          <input type="radio" name="${this._radioName}" value="${esc(p.id)}"> ${esc(p.label)}
          ${swatch(p.base, p.tokens)}
          <button type="button" class="sb-theme-settings__delete" data-action="delete" data-id="${esc(p.id)}" aria-label="Delete ${esc(p.label)}" title="Delete">×</button>
        </label>`);
      this._list.innerHTML = builtIn.concat(saved).join('');
      this._list.querySelectorAll('input').forEach((input) => { input.checked = input.value === theme.choice; });
    }

    _toggleEditor(button) {
      this._editor.hidden = !this._editor.hidden;
      button.setAttribute('aria-expanded', String(!this._editor.hidden));
      this._renderEditor();
    }

    // Shows the values currently in effect, whichever theme or preset supplied them.
    _renderEditor() {
      this._editorChoice = theme.choice;
      if (this._editor.hidden) return;
      const current = getComputedStyle(document.documentElement);
      const preset = theme.findPreset(theme.choice);
      const tokens = TOKENS.map((t) => {
        const wide = t.type === 'color' ? '' : ' sb-theme-settings__token--wide';
        const value = current.getPropertyValue(`--sb-${t.name}`).trim();
        return `<label class="sb-theme-settings__token${wide}">${t.label}${tokenInput(t, value)}</label>`;
      });
      this._editor.innerHTML = `
        <div class="sb-theme-settings__tokens">${tokens.join('')}</div>
        <div class="sb-theme-settings__save">
          <span class="sb-theme-settings__unsaved" data-draft>Unsaved changes, shown live.</span>
          <input class="sb-theme-settings__name" type="text" placeholder="Name for a new preset" aria-label="Preset name">
          <button type="button" class="sb-theme-settings__button sb-theme-settings__button--primary" data-action="save">Save as new preset</button>
          ${preset ? `<button type="button" class="sb-theme-settings__button" data-action="update" data-draft>Update “${esc(preset.label)}”</button>` : ''}
          <button type="button" class="sb-theme-settings__button" data-action="discard" data-draft>Discard</button>
        </div>`;
      this._showDraftState();
    }

    _showDraftState() {
      this._editor.querySelectorAll('[data-draft]').forEach((el) => { el.hidden = !theme.draft; });
    }
  }

  customElements.define('sb-theme-settings', SbThemeSettings);
})();
