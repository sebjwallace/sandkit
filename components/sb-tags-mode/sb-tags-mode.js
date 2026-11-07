// Sandkit sb-tags-mode 0.3.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Tags mode: see what any part of the page is about, and choose topics to keep lit. Pointing at a
// tagged part shows its tags in a card at the side, with what each means; a click holds it. Clicking
// a tag keeps everything carrying it lit, after the mode ends too, until it's cleared. Given a way to
// search, a second tab finds what carries the chosen tags. A mode, chosen in the shell's picker.
//
//   <sb-tags-mode slot="modes"></sb-tags-mode>
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-tags-mode';
  const existing = customElements.get('sb-tags-mode');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-tags-mode>, so only one can run. Rename one by replacing every "sb-tags-mode" in its file.`);
    }
    return;
  }

  const DELAY = 120; // ms of pointing before showing, so crossing parts on the way doesn't flicker
  const KEY = 'g';
  const MEMORY = 'sb-tags-mode';

  const CSS = `
    .sb-tags-mode { --sb-tags-mode-tone: var(--sb-accent, #2563eb); --sb-tags-mode-chosen: var(--sb-tag-focus, color-mix(in srgb, var(--sb-accent, #2563eb) 30%, #c026d3)); display: contents; }
    .sb-tags-mode__banner { position: fixed; inset: auto auto 16px 50%; transform: translateX(-50%); margin: 0; display: none; align-items: center; gap: 10px; padding: 6px 8px 6px 14px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 600 13px var(--sb-font, system-ui, sans-serif); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); }
    .sb-tags-mode__banner:popover-open { display: inline-flex; }
    .sb-tags-mode__button { padding: 5px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: inherit; cursor: pointer; }
    .sb-tags-mode__outline { position: fixed; box-sizing: border-box; margin: 0; padding: 0; border: 2px dashed var(--sb-tags-mode-tone); border-radius: 4px; background: transparent; pointer-events: none; }
    .sb-tags-mode--held .sb-tags-mode__outline { border-style: solid; }
    .sb-tags-mode__card { position: fixed; inset: 72px 16px auto auto; box-sizing: border-box; width: min(340px, calc(100vw - 32px)); max-height: calc(100vh - 150px); margin: 0; padding: 0; flex-direction: column; overflow: hidden; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 13px/1.45 var(--sb-font, system-ui, sans-serif); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28); }
    .sb-tags-mode__card:popover-open { display: flex; }
    .sb-tags-mode__card:focus { outline: none; }
    .sb-tags-mode__bar { display: flex; flex: none; align-items: center; gap: 6px; padding: 5px 8px 5px 10px; border-bottom: 1px solid var(--sb-border, #d5d9e0); background: var(--sb-surface-2, #eef0f3); cursor: move; touch-action: none; user-select: none; }
    .sb-tags-mode__grip { flex: none; width: 10px; height: 14px; color: var(--sb-muted, #616e7c); background: radial-gradient(circle, currentColor 1.3px, transparent 1.6px) 0 0 / 5px 5px; }
    .sb-tags-mode__body { display: grid; gap: 12px; padding: 10px 12px 12px; overflow-y: auto; }
    .sb-tags-mode__name { flex: 1; overflow: hidden; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
    .sb-tags-mode__close { padding: 2px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 4px; background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__title { margin: 0 0 6px; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .sb-tags-mode__hint { margin: 0; color: var(--sb-muted, #616e7c); }
    .sb-tags-mode__meaning { display: grid; gap: 2px; margin-bottom: 8px; }
    .sb-tags-mode__meaning:last-child { margin-bottom: 0; }
    .sb-tags-mode__meaning > .sb-tags-mode__chip { justify-self: start; }
    .sb-tags-mode__means { margin: 0; color: var(--sb-muted, #616e7c); }
    .sb-tags-mode__chip { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__chip--retired { border-style: dotted; background: transparent; color: var(--sb-muted, #616e7c); cursor: default; text-decoration: line-through; }
    .sb-tags-mode__list { display: grid; gap: 1px; }
    .sb-tags-mode__presets:empty { display: none; }
    .sb-tags-mode__preset { display: block; box-sizing: border-box; width: 100%; overflow: hidden; padding: 3px 6px; border: 1px solid transparent; border-radius: 4px; background: none; color: var(--sb-text, #1f2933); font: 13px var(--sb-font, system-ui, sans-serif); text-align: left; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
    .sb-tags-mode__preset:hover { border-color: var(--sb-border, #d5d9e0); }
    .sb-tags-mode__preset[aria-pressed="true"] { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent-soft, color-mix(in srgb, var(--sb-accent, #2563eb) 18%, transparent)); font-weight: 600; }
    .sb-tags-mode__line { display: flex; align-items: center; gap: 4px; }
    .sb-tags-mode__signs { display: inline-flex; flex: none; gap: 1px; }
    .sb-tags-mode__sign { box-sizing: border-box; width: 20px; height: 20px; padding: 0; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 4px; background: none; color: var(--sb-muted, #616e7c); font: 700 13px/1 var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__sign:hover { border-color: var(--sb-tags-mode-chosen); color: var(--sb-text, #1f2933); }
    .sb-tags-mode__sign[aria-pressed="true"] { border-color: var(--sb-tags-mode-chosen); background: var(--sb-tags-mode-chosen); color: #fff; }
    .sb-tags-mode__entry { display: flex; flex: 1; min-width: 0; align-items: center; gap: 6px; box-sizing: border-box; padding: 3px 6px; border: 1px solid transparent; border-radius: 4px; background: none; color: var(--sb-text, #1f2933); font: 13px var(--sb-font, system-ui, sans-serif); text-align: left; cursor: pointer; }
    .sb-tags-mode__entry:hover { border-color: color-mix(in srgb, var(--sb-tags-mode-chosen) 60%, transparent); }
    .sb-tags-mode__entry[aria-pressed="true"] { background: color-mix(in srgb, var(--sb-tags-mode-chosen) 24%, transparent); font-weight: 600; }
    .sb-tags-mode__entry[data-minus] .sb-tags-mode__label { text-decoration: line-through; }
    .sb-tags-mode__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sb-tags-mode__pin { flex: none; box-sizing: border-box; width: 14px; height: 14px; border: 2px solid var(--sb-tags-mode-chosen); border-radius: 3px; opacity: 0.5; }
    .sb-tags-mode__entry:hover .sb-tags-mode__pin { opacity: 0.8; }
    .sb-tags-mode__entry[aria-pressed="true"] .sb-tags-mode__pin { background: var(--sb-tags-mode-chosen); opacity: 1; }
    .sb-tags-mode__count { color: var(--sb-muted, #616e7c); font-size: 11px; }
    .sb-tags-mode__mark { margin: 0; color: var(--sb-muted, #616e7c); font-size: 11px; font-style: italic; }
    .sb-tags-mode__lit { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
    .sb-tags-mode__said { margin: 6px 0 0; color: var(--sb-muted, #616e7c); font-size: 11px; white-space: nowrap; }
    .sb-tags-mode__lit button:disabled { opacity: 0.45; cursor: default; }
    .sb-tags-mode__switch { display: inline-flex; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); overflow: hidden; }
    .sb-tags-mode__switch button { padding: 2px 8px; border: 0; background: transparent; color: var(--sb-text, #1f2933); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__switch button[aria-pressed="true"] { background: var(--sb-tags-mode-chosen); color: #fff; font-weight: 700; }
    .sb-tags-mode__clear { padding: 2px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: transparent; color: var(--sb-text, #1f2933); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__tabs { display: flex; flex: none; gap: 2px; padding: 0 8px; border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-tags-mode__tabs[hidden], .sb-tags-mode__body[hidden] { display: none; }
    .sb-tags-mode__tab { margin-bottom: -1px; padding: 6px 10px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--sb-muted, #616e7c); font: 600 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__tab[aria-selected="true"] { border-bottom-color: var(--sb-tags-mode-tone); color: var(--sb-text, #1f2933); }
    .sb-tags-mode__size { margin: 3px 0 3px auto; padding: 2px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 4px; background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__size[hidden] { display: none; }
    .sb-tags-mode__pick { display: grid; gap: 12px; align-content: start; }
    .sb-tags-mode--full .sb-tags-mode__card { inset: 24px; width: auto; height: auto; max-height: none; }
    .sb-tags-mode--full .sb-tags-mode__body.sb-tags-mode__search { flex: 1; min-height: 0; grid-template-columns: minmax(220px, 300px) 1fr; overflow: hidden; }
    .sb-tags-mode--full .sb-tags-mode__pick, .sb-tags-mode--full .sb-tags-mode__found { min-height: 0; overflow-y: auto; }
    .sb-tags-mode--full .sb-tags-mode__summary { white-space: normal; }
    .sb-tags-mode__filter { box-sizing: border-box; width: 100%; padding: 5px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 13px var(--sb-font, system-ui, sans-serif); }
    .sb-tags-mode__results { display: grid; gap: 4px; }
    .sb-tags-mode__result { display: grid; grid-template-columns: 34px 1fr; gap: 0 8px; padding: 4px 6px; border-radius: 4px; background: var(--sb-surface-2, #eef0f3); }
    .sb-tags-mode__score { grid-row: span 2; color: var(--sb-muted, #616e7c); font-size: 12px; font-variant-numeric: tabular-nums; }
    .sb-tags-mode__ref { font-weight: 700; }
    .sb-tags-mode__kind { margin-left: 6px; color: var(--sb-muted, #616e7c); font-size: 11px; }
    .sb-tags-mode__result { position: relative; }
    .sb-tags-mode__pull, .sb-tags-mode__here { position: absolute; top: 4px; right: 6px; }
    .sb-tags-mode__pull { padding: 1px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 4px; background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 11px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__here { color: var(--sb-muted, #616e7c); font-size: 11px; }
    .sb-tags-mode__summary { overflow: hidden; color: var(--sb-text, #1f2933); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .sb-tags-mode button:focus-visible { outline: 2px solid var(--sb-tags-mode-tone); outline-offset: 1px; }`;

  // Viewers' clicks and presses, stopped in the mode so they hold instead of act.
  const STOPPED = ['click', 'dblclick', 'pointerdown', 'pointerup', 'mousedown', 'mouseup'];

  // TEMPORARY: colours for tags that don't declare their own. A tag's colour belongs in its
  // declaration, `{ tag, means, color }`, which is what `_colorOf` reads first. Once tags are given
  // colours where they're managed, this list and `fallbackColor` can go, and nothing else changes.
  const FALLBACK_COLORS = ['#d946ef', '#14b8a6', '#f97316', '#8b5cf6', '#65a30d', '#e11d48', '#a0693b'];

  // The same colour for a tag every time: by its place in the declarations, or its name if it has
  // none. If another chosen tag already wears it, the next free one, so what's lit stays apart.
  function fallbackColor(tag, declaredTags, taken) {
    const place = declaredTags.indexOf(tag);
    const start = place >= 0 ? place : [...tag].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
    const inTurn = FALLBACK_COLORS.map((_, i) => FALLBACK_COLORS[(start + i) % FALLBACK_COLORS.length]);
    return inTurn.find((color) => !taken.includes(color)) ?? inTurn[0];
  }

  // How many results the card shows, and how many tags a name typed can bring up.
  const RESULTS_SHOWN = 8;
  const MATCHES_SHOWN = 8;

  // How well a name typed fits a tag: 0 not at all, then higher the closer. Its letters must come in
  // order, so "plch" finds platform-changes; the start of the tag fits best, then a run of it.
  function fit(typed, tag) {
    const letters = typed.toLowerCase().replace(/[\s-]+/g, ''), name = tag.toLowerCase();
    if (!letters) return 0;
    if (name.startsWith(letters)) return 3;
    if (name.replace(/-/g, '').includes(letters)) return 2;
    let at = 0;
    for (const letter of letters) if (!(at = name.indexOf(letter, at) + 1)) return 0;
    return 1;
  }

  // What every mode lets through (data-modes, such as the shell's mode picker), and open dialogs.
  const LET_THROUGH = '[data-modes], dialog[open]';

  const POINTING = 'Tags: point at a part to see its tags, click to hold it, click a tag to keep it lit';
  const HOLDING = 'Held: click it again, or anywhere else, to let go';

  const typing = (el) => el.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
  const tagsOf = (part) => part.dataset.tags.split(/\s+/).filter(Boolean);
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  function addStyle() {
    if (document.getElementById('sb-tags-mode-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-tags-mode-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // An element with the component's classes. Text is only ever text, never markup.
  function el(tag, classes, text) {
    const node = document.createElement(tag);
    node.className = classes.split(' ').map((name) => `sb-tags-mode__${name}`).join(' ');
    if (text != null) node.textContent = text;
    return node;
  }

  // Memory lasts as long as the tab, and may be missing or refuse, as in a private window.
  function recall() {
    try {
      const { tags, match, without } = JSON.parse(sessionStorage.getItem(MEMORY));
      const chosen = tags.filter((tag) => typeof tag === 'string');
      return { tags: chosen, match: match === 'any' ? 'any' : 'all', without: (without ?? []).filter((tag) => chosen.includes(tag)) };
    } catch {
      return { tags: [], match: 'all', without: [] };
    }
  }

  function remember(tags, match, without) {
    try { sessionStorage.setItem(MEMORY, JSON.stringify({ tags, match, without })); } catch { /* kept in memory only */ }
  }

  class SbTagsMode extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._active = false;
      this._chosen = [];
      this._without = []; // the chosen tags that take away from what's lit, rather than add to it
      this.presets = null; // named selections; the page's TAG_PRESETS when left unset
      this._stayListed = new Set(); // tags with nothing to see that were pinned: listed until the mode next starts
      this._match = 'all';
      this._shown = null;  // the part whose tags are in the card, or null
      this._held = false;
      this._timer = null;
      this.declarations = null; // what each tag means; the page's TAGS when left unset
      this._search = null;  // the page's way to search, which brings the Search tab
      this._tab = 'display';
      this._full = false;   // the Search tab filling the window
      this._stop = (e) => this._intercept(e);
      this._point = (e) => this._wait(e.target);
      this._focus = (e) => this._focused(e.target);
      this._keys = (e) => this._press(e);
      this._follow = () => this._placeOutline();
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-tags-mode');
      if (!this._built) {
        this._built = true;
        this._render();
        const { tags, match, without } = recall();
        this._chosen = tags;
        this._match = match;
        this._without = without;
      }
      // Moving an element closes its popovers, and the shell moves its modes.
      this.active = this._active;
      this._lightChosen();
      this._drawChosen();
    }

    disconnectedCallback() {
      this._listen(false);
      clearTimeout(this._timer);
    }

    // ---- Public API ----

    // The mode's name, in the shell's mode picker.
    get heading() { return this.getAttribute('heading') || 'Tags'; }

    // The mode's key in the shell. T is usually Trace's, and whichever came first would keep it.
    get key() { return KEY; }

    // Whether the mode is on. Setting it fires no event: sb-mode reports the viewer's choices.
    get active() { return this._active; }
    set active(on) {
      const starting = Boolean(on) && !this._active;
      this._active = Boolean(on);
      if (starting) this._stayListed.clear();
      if (!this._built || !this.isConnected) return;
      this._listen(this._active);
      this._banner.togglePopover(this._active);
      this._card.togglePopover(this._active);
      if (!this._active) {
        this._letGo();
        this._setFull(false);
      }
      this._drawChosen();
      this._drawPage();
      this._drawTabs();
      if (starting) this._card.focus({ preventScroll: true });
    }

    // The tags kept lit.
    get chosen() { return [...this._chosen]; }
    set chosen(tags) { this._setChosen(Array.isArray(tags) ? tags.filter((tag) => typeof tag === 'string') : []); }

    // The chosen tags that take away: whatever carries one isn't lit. Only a chosen tag can be one.
    get without() { return [...this._without]; }
    set without(tags) {
      this._without = this._chosen.filter((tag) => Array.isArray(tags) && tags.includes(tag));
      this._choiceChanged();
    }

    // Whether a part needs every chosen tag, or any of them.
    get match() { return this._match; }
    set match(value) {
      this._match = value === 'any' ? 'any' : 'all';
      this._choiceChanged();
    }

    // The page's way to search by tags: (selection, onPage) → [{ ref, score, kind?, label? }], best
    // first. selection is null when nothing is chosen, and onPage lists the refs people can see.
    get search() { return this._search; }
    set search(fn) {
      this._search = typeof fn === 'function' ? fn : null;
      if (!this._search) this._tab = 'display';
      if (this._built) this._drawTabs();
    }

    // ---- Building ----

    _render() {
      this.append(
        Object.assign(el('div', 'outline'), { popover: 'manual' }),
        Object.assign(el('section', 'card'), { popover: 'manual', tabIndex: -1, ariaLabel: 'Tags' }),
        Object.assign(el('div', 'banner'), { popover: 'manual' })
      );
      const part = (name) => this.querySelector(`.sb-tags-mode__${name}`);
      [this._outlineBox, this._card, this._banner] = ['outline', 'card', 'banner'].map(part);

      const bar = el('div', 'bar');
      bar.title = 'Drag to move';
      const close = el('button', 'close', '✕');
      Object.assign(close, { type: 'button', title: 'Close: end Tags mode' });
      close.setAttribute('aria-label', 'Close');
      close.addEventListener('click', () => this._end());
      bar.append(el('span', 'grip'), el('span', 'name', this.heading), close);
      this._partArea = el('div', 'part');
      this._litArea = el('div', 'chosen');
      this._presetArea = el('div', 'presets');
      this._pageArea = el('div', 'page');
      this._display = el('div', 'body');
      // The list comes first, with nothing above it that changes, so a line stays under the pointer.
      this._display.append(this._presetArea, this._pageArea, this._litArea, this._partArea);
      this._card.append(bar, this._buildTabs(), this._display, this._buildSearch());
      this._draggable(bar);

      this._words = el('span', 'words', POINTING);
      const stop = el('button', 'button', 'Stop');
      stop.type = 'button';
      stop.addEventListener('click', () => this._end());
      this._banner.append(this._words, stop);

      this._card.addEventListener('click', (e) => this._control(e));
      this._drawPart();
    }

    _buildTabs() {
      this._tabs = el('div', 'tabs');
      this._tabs.setAttribute('role', 'tablist');
      for (const [tab, words] of [['display', 'Display'], ['search', 'Search']]) {
        const button = this._button('tab', words, `tab:${tab}`, { tab });
        button.setAttribute('role', 'tab');
        this._tabs.append(button);
      }
      this._size = this._button('size', '', 'size', { size: '' });
      this._tabs.append(this._size);
      return this._tabs;
    }

    // Typing a tag's name narrows the tags to choose from; with nothing typed, the chosen ones show.
    _buildSearch() {
      this._searchPanel = el('div', 'body search');
      this._filter = Object.assign(el('input', 'filter'), { type: 'search', placeholder: 'Search tags…', ariaLabel: 'Search tags' });
      this._filter.addEventListener('input', () => this._drawSearch());
      this._filter.addEventListener('keydown', (e) => {
        const first = this._matchArea.querySelector('[data-tag]');
        if (e.key === 'Enter' && first) this._chooseTyped(first.dataset.tag, 'plus');
      });
      this._matchArea = el('div', 'matches');
      this._resultArea = el('div', 'found');
      const pick = el('div', 'pick');
      pick.append(this._filter, this._matchArea);
      this._searchPanel.append(pick, this._resultArea);
      return this._searchPanel;
    }

    // The card moves by its bar, so it never has to cover a part someone wants to see.
    _draggable(bar) {
      bar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return; // its buttons are for pressing, not dragging
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
      method('focusin', this._focus, true);
      method('keydown', this._keys, true);
      method('scroll', this._follow, true);
      method('resize', this._follow);
    }

    // ---- Reading the page ----

    // What each tag means, by name: this.declarations, or the page's TAGS (see the tagging practice).
    _declared() {
      const list = this.declarations ?? (typeof TAGS === 'undefined' ? [] : TAGS);
      const usable = Array.isArray(list) ? list.filter((entry) => typeof entry?.tag === 'string') : [];
      return new Map(usable.map((entry) => [entry.tag, entry]));
    }

    // Each chosen tag's colour: what its declaration says, or else a fallback for now, in the order
    // they were chosen, so a tag keeps its colour while it stays chosen.
    _chosenColors() {
      const declared = this._declared(), colors = {};
      const own = this._chosen.map((tag) => declared.get(tag)?.color).filter(Boolean);
      for (const tag of this._chosen) {
        colors[tag] = declared.get(tag)?.color ?? fallbackColor(tag, [...declared.keys()], [...own, ...Object.values(colors)]);
      }
      return colors;
    }

    _colorOf(tag) {
      const declared = this._declared();
      return this._chosenColors()[tag] ?? declared.get(tag)?.color ?? fallbackColor(tag, [...declared.keys()], []);
    }

    // Everything tagged. Only the data-tags attribute is read, never the page's content.
    _tagged() {
      return [...document.querySelectorAll('[data-tags]:not([data-tags=""])')];
    }

    // What someone can see without opening anything, so the count agrees with what lights up.
    _visibleParts() {
      return this._tagged().filter((part) => part.checkVisibility());
    }

    _steppable() {
      const parts = this._visibleParts();
      return this._chosen.length ? parts.filter((part) => this._carriesChosen(part)) : parts;
    }

    _partAt(target) {
      if (this.contains(target) || target.closest?.(LET_THROUGH)) return null;
      return target.closest?.('[data-tags]:not([data-tags=""])') ?? null;
    }

    _carriesChosen(part) {
      const tags = tagsOf(part);
      const has = (tag) => tags.includes(tag);
      if (this._without.some(has)) return false;
      const adding = this._adding();
      if (!adding.length) return tags.length > 0; // only taking away: from everything tagged
      return this._match === 'any' ? adding.some(has) : adding.every(has);
    }

    // ---- Pointing and holding ----

    // Pointing at a part shows it after a moment. Pointing at anything else keeps what's shown, so
    // the pointer can travel to the card.
    _wait(target) {
      clearTimeout(this._timer);
      if (this._held) return;
      const part = this._partAt(target);
      if (!part || part === this._shown) return;
      this._timer = setTimeout(() => this._show(part), DELAY);
    }

    _focused(target) {
      if (this._held || !target.matches?.(':focus-visible')) return;
      const part = this._partAt(target);
      if (part) this._show(part);
    }

    // A click anywhere but the mode's own parts, or what every mode lets through, holds instead of
    // acting: a tagged part is held, the part held lets go, and anywhere else lets go.
    _intercept(e) {
      if (this.contains(e.target) || e.target.closest?.(LET_THROUGH)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.type !== 'click') return;
      clearTimeout(this._timer);
      const part = this._partAt(e.target);
      if (!part || (this._held && part === this._shown)) return this._letGo();
      this._show(part);
      this._hold(true);
    }

    // Escape ends the mode. The arrow keys step through what's kept lit, or everything tagged when
    // nothing is, so people can find what's lit on a long page, and the keyboard reaches parts that
    // can't take focus. Both leave a field or an open dialog alone.
    _press(e) {
      if (e.key === 'Escape' && this._full) return this._setFull(false);
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) return this._end();
      if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || typing(e.target) || document.querySelector('dialog[open]')) return;
      e.preventDefault();
      const parts = this._steppable();
      if (!parts.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      const at = parts.indexOf(this._shown);
      const next = parts[at === -1 ? (step === 1 ? 0 : parts.length - 1) : (at + step + parts.length) % parts.length];
      clearTimeout(this._timer);
      next.scrollIntoView({ block: 'center' });
      this._show(next);
      this._hold(true);
    }

    _show(part) {
      this._shown = part;
      this._outlineBox.togglePopover(true);
      this._placeOutline();
      this._drawPart();
    }

    _hold(on) {
      this._held = on;
      this.classList.toggle('sb-tags-mode--held', on);
      this._words.textContent = on ? HOLDING : POINTING;
    }

    _letGo() {
      clearTimeout(this._timer);
      this._shown = null;
      this._hold(false);
      this._outlineBox.togglePopover(false);
      this._drawPart();
    }

    // Drawn over the part in the top layer, so nothing is added to what anyone else drew.
    _placeOutline() {
      const part = this._shown;
      if (!part) return;
      if (!part.isConnected) return this._outlineBox.togglePopover(false);
      const r = part.getBoundingClientRect();
      Object.assign(this._outlineBox.style, { left: `${r.left - 4}px`, top: `${r.top - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px` });
    }

    // The viewer stopped, with Stop or Escape. Chosen tags stay lit.
    _end() {
      this.active = false;
      this.dispatchEvent(new CustomEvent('sb-mode', { bubbles: true, detail: { mode: this.heading, active: false } }));
    }

    // ---- Choosing ----

    _control(e) {
      const control = e.target.closest('button');
      if (!control) return;
      const typed = this._filter.value && this._matchArea.contains(control);
      if (typed && (control.dataset.tag || control.dataset.signFor)) this._chooseTyped(control.dataset.tag ?? control.dataset.signFor, control.dataset.sign ?? 'plus');
      else if (control.dataset.tab) this._showTab(control.dataset.tab);
      else if (control.dataset.size != null) this._setFull(!this._full);
      else if (control.dataset.pull) this._pull(control.dataset.pull);
      else if (control.dataset.preset) this._togglePreset(this._presetList()[control.dataset.preset]);
      else if (control.dataset.signFor) this._setSign(control.dataset.signFor, control.dataset.sign);
      else if (control.dataset.tag) this._toggle(control.dataset.tag);
      else if (control.dataset.match) this.match = control.dataset.match;
      else if (control.dataset.clear != null) this._setChosen([]);
    }

    // A tag found by typing its name comes on, and the typing clears, so what it finds shows.
    _chooseTyped(tag, sign) {
      this._filter.value = '';
      this._setSign(tag, sign);
    }

    _toggle(tag) {
      this._setChosen(this._chosen.includes(tag) ? this._chosen.filter((t) => t !== tag) : [...this._chosen, tag]);
    }

    // Turning a tag off forgets its sign, so it always comes back adding.
    _setChosen(tags) {
      this._chosen = [...new Set(tags)];
      this._without = this._without.filter((tag) => this._chosen.includes(tag));
      this._choiceChanged();
    }

    // Plus or minus on a tag, which turns it on if it isn't.
    _setSign(tag, sign) {
      if (!this._chosen.includes(tag)) this._chosen = [...this._chosen, tag];
      this._without = this._without.filter((t) => t !== tag);
      if (sign === 'minus') this._without.push(tag);
      this._choiceChanged();
    }

    // ---- Presets ----
    // A preset is a saved selection, nothing more: choosing one sets the lines and signs, and whether
    // it's chosen is only ever worked out from them, so there's no second state to keep in step.

    _presetList() {
      const list = this.presets ?? (typeof TAG_PRESETS === 'undefined' ? [] : TAG_PRESETS);
      return Array.isArray(list) ? list.filter((preset) => typeof preset?.name === 'string') : [];
    }

    _isChosen({ tags = [], without = [], match = 'all' }) {
      const same = (a, b) => a.length === b.length && a.every((tag) => b.includes(tag));
      return same(this._adding(), tags) && same(this._without, without) && (tags.length < 2 || this._match === match);
    }

    _togglePreset(preset) {
      const { tags = [], without = [], match = 'all' } = this._isChosen(preset) ? {} : preset;
      this._chosen = [...new Set([...tags, ...without])];
      this._without = [...without];
      this._match = match === 'any' ? 'any' : 'all';
      this._choiceChanged();
    }

    _drawPresets() {
      const presets = this._presetList();
      if (!presets.length) return this._presetArea.replaceChildren();
      const list = el('div', 'list');
      presets.forEach((preset, index) => {
        const button = this._button('preset', preset.name, `preset:${index}`, { preset: String(index) });
        button.setAttribute('aria-pressed', String(this._isChosen(preset)));
        if (preset.asks) button.title = preset.asks;
        list.append(button);
      });
      this._presetArea.replaceChildren(el('p', 'title', 'Presets'), list);
    }

    _adding() { return this._chosen.filter((tag) => !this._without.includes(tag)); }

    _choiceChanged() {
      remember(this._chosen, this._match, this._without);
      this._lightChosen();
      if (this._built) this._keepingFocus(() => {
        this._drawPart();
        this._drawChosen();
        this._drawPage();
        this._drawSearch();
      });
    }

    // Lighting is the highlighting script's job: this only says what's chosen.
    _lightChosen() {
      this.dispatchEvent(new CustomEvent('sb-tag-focus', { bubbles: true, detail: { tags: this._adding(), match: this._match, colors: this._chosenColors(), without: this.without } }));
    }

    // ---- Drawing ----

    // Redrawing replaces the controls, so keyboard focus goes back to the one that had it.
    _keepingFocus(draw) {
      const key = this.contains(document.activeElement) ? document.activeElement.dataset.key : null;
      draw();
      if (!key) return;
      const control = [...this.querySelectorAll('[data-key]')].find((node) => node.dataset.key === key && !node.disabled && node.checkVisibility());
      if (control) control.focus();
      else if (this._active) this._card.focus({ preventScroll: true });
    }

    _button(classes, text, key, data) {
      const button = el('button', classes, text);
      button.type = 'button';
      button.dataset.key = key;
      Object.assign(button.dataset, data);
      return button;
    }

    // A tag as a line in a list: its name, how many carry it if that's known, and a pin in its colour.
    _entry(tag, area, count) {
      const entry = this._button('entry', '', `${area}:${tag}`, { tag });
      entry.setAttribute('aria-pressed', String(this._chosen.includes(tag)));
      entry.style.setProperty('--sb-tags-mode-chosen', this._colorOf(tag));
      entry.append(el('span', 'label', tag));
      if (count != null) entry.append(el('span', 'count', String(count)));
      entry.append(el('span', 'pin'));
      if (this._without.includes(tag)) entry.dataset.minus = '';
      const line = el('div', 'line');
      line.style.setProperty('--sb-tags-mode-chosen', this._colorOf(tag));
      line.append(entry, this._signs(tag, area));
      return line;
    }

    // Plus adds to what's lit, and minus takes away. Neither shows as chosen while the tag is off.
    _signs(tag, area) {
      const signs = el('span', 'signs');
      signs.setAttribute('role', 'group');
      signs.setAttribute('aria-label', `What ${tag} does`);
      const on = this._chosen.includes(tag), minus = this._without.includes(tag);
      for (const [sign, symbol, words, chosen] of [['plus', '+', `Add ${tag}`, on && !minus], ['minus', '−', `Take away ${tag}`, on && minus]]) {
        const button = this._button('sign', symbol, `${area}:${tag}:${sign}`, { signFor: tag, sign });
        button.title = words;
        button.setAttribute('aria-label', words);
        button.setAttribute('aria-pressed', String(chosen));
        signs.append(button);
      }
      return signs;
    }

    // What's pointed at or held: each of its tags, with what it means.
    _drawPart() {
      const area = this._partArea;
      if (!this._shown) {
        area.replaceChildren(el('p', 'hint', 'Point at a part to see its tags here, or step through them with the arrow keys.'));
        return;
      }
      const declared = this._declared();
      const name = this._shown.dataset.ref;
      const rows = tagsOf(this._shown).map((tag) => this._meaning(tag, declared));
      area.replaceChildren(el('p', 'title', name ? `This part · ${name}` : 'This part'), ...rows);
    }

    _meaning(tag, declared) {
      const row = el('div', 'meaning');
      const entry = declared.get(tag);
      const retired = Array.isArray(entry?.replacedBy);
      if (retired) {
        row.append(el('span', 'chip chip--retired', tag));
        row.append(el('p', 'mark', entry.replacedBy.length ? `Retired: replaced by ${entry.replacedBy.join(', ')}` : 'Retired: dropped, with nothing in its place'));
      } else {
        row.append(this._entry(tag, 'part'));
        if (!entry && declared.size) row.append(el('p', 'mark', 'Undeclared: nothing says what it means yet'));
      }
      if (entry?.means) row.append(el('p', 'means', entry.means));
      return row;
    }

    // The controls for what's kept lit, always all there in the card, so the card never changes shape.
    _drawChosen() {
      const clear = (off) => {
        const button = this._button('clear', 'Clear', 'clear', { clear: '' });
        button.disabled = off;
        return button;
      };
      const none = !this._chosen.length;

      const count = none ? 0 : this._visibleParts().filter((part) => this._carriesChosen(part)).length;
      const controls = el('div', 'lit');
      controls.append(this._switch(this._adding().length < 2), clear(none));
      const said = none ? 'Nothing kept lit yet' : `${plural(count, 'part')}${count ? ' · ↑ ↓ to visit' : ''}`;
      this._litArea.replaceChildren(el('p', 'title', 'Kept lit'), controls, el('p', 'said', said));
    }

    _switch(off) {
      const group = el('span', 'switch');
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', 'Combine tags by');
      for (const [match, words, title] of [['all', 'Intersection', 'Parts carrying every one of these tags'], ['any', 'Union', 'Parts carrying at least one of these tags']]) {
        const button = document.createElement('button');
        Object.assign(button, { type: 'button', textContent: words, title });
        button.dataset.key = `match:${match}`;
        button.dataset.match = match;
        button.setAttribute('aria-pressed', String(this._match === match));
        button.disabled = off;
        group.append(button);
      }
      return group;
    }

    // The tags here to see, most used first, and any pinned, so a pin can always be taken off. Retired
    // tags are never offered, and a tag no declaration mentions is marked, once there are declarations.
    _drawPage() {
      if (!this._active) return;
      this._drawPresets();
      const declared = this._declared();
      const counts = new Map([...declared.keys()].map((tag) => [tag, 0]));
      for (const part of this._tagged()) for (const tag of tagsOf(part)) if (!counts.has(tag)) counts.set(tag, 0);
      for (const part of this._visibleParts()) for (const tag of new Set(tagsOf(part))) counts.set(tag, counts.get(tag) + 1);

      this._chosen.forEach((tag) => this._stayListed.add(tag));
      const current = [...counts].filter(([tag, count]) => !Array.isArray(declared.get(tag)?.replacedBy) && (count > 0 || this._stayListed.has(tag)));
      current.sort(([a, x], [b, y]) => y - x || a.localeCompare(b));
      const list = el('div', 'list');
      for (const [tag, count] of current) {
        const entry = this._entry(tag, 'page', count);
        if (declared.get(tag)?.means) entry.title = declared.get(tag).means;
        if (declared.size && !declared.has(tag)) entry.querySelector('.sb-tags-mode__count').before(el('span', 'mark', 'undeclared'));
        list.append(entry);
      }
      this._pageArea.replaceChildren(el('p', 'title', 'On this page'), current.length ? list : el('p', 'hint', 'Nothing here carries a tag yet.'));
    }

    // ---- Searching ----

    _showTab(tab) {
      this._tab = tab;
      if (tab !== 'search') this._setFull(false);
      this._drawTabs();
      if (tab === 'search') this._filter.focus();
    }

    // Full, the card fills the window, wherever it was dragged, and goes back there after.
    _setFull(on) {
      if (on === this._full) return;
      this._full = on;
      if (on) [this._placed, this._card.style.cssText] = [this._card.style.cssText, ''];
      else this._card.style.cssText = this._placed ?? '';
      this.classList.toggle('sb-tags-mode--full', on);
      this._drawTabs();
    }

    // Tabs only when the page can search; without them the card is as it always was.
    _drawTabs() {
      this._tabs.hidden = !this._search;
      this._size.hidden = this._tab !== 'search';
      this._size.textContent = this._full ? 'Smaller' : 'Full screen';
      for (const button of this._tabs.children) button.setAttribute('aria-selected', String(button.dataset.tab === this._tab));
      this._display.hidden = this._tab !== 'display';
      this._searchPanel.hidden = this._tab !== 'search';
      this._drawSearch();
    }

    _drawSearch() {
      if (!this._active || this._tab !== 'search') return;
      this._drawMatches();
      this._drawResults();
    }

    // Tags whose names fit what's typed, best first; or with nothing typed, every tag in full screen,
    // and the chosen ones in the card.
    _drawMatches() {
      const declared = this._declared();
      const current = [...declared.values()].filter((entry) => !Array.isArray(entry.replacedBy)).map(({ tag }) => tag);
      const typed = this._filter.value.trim();
      const tags = typed
        ? current.map((tag) => ({ tag, fit: fit(typed, tag) })).filter(({ fit }) => fit).sort((a, b) => b.fit - a.fit || a.tag.localeCompare(b.tag)).slice(0, MATCHES_SHOWN).map(({ tag }) => tag)
        : this._full ? current : this._chosen;
      const list = el('div', 'list');
      list.append(...tags.map((tag) => this._entry(tag, 'search')));
      const hint = typed ? 'No tag fits that name.' : 'Type a tag\'s name to choose it.';
      const combine = !typed && this._adding().length > 1 ? [this._switch(false)] : [];
      this._matchArea.replaceChildren(...(tags.length ? [el('p', 'title', typed || this._full ? 'Tags' : 'Chosen'), list, ...combine] : [el('p', 'hint', hint)]));
    }

    // What the page finds for the chosen tags, or with none, what's most like what's here.
    _drawResults() {
      const adding = this._adding();
      const selection = adding.length || this._without.length ? { tags: adding, match: this._match, without: this.without } : null;
      const onPage = [...new Set(this._visibleParts().map((part) => part.dataset.ref).filter(Boolean))];
      const found = this._search(selection, onPage);
      const results = Array.isArray(found) ? found.filter((result) => typeof result?.ref === 'string') : [];
      const shown = this._full ? results : results.slice(0, RESULTS_SHOWN);
      const title = `${selection ? 'Found' : 'Related to this page'}${results.length > shown.length ? ` · ${shown.length} of ${results.length}` : ''}`;
      const list = el('div', 'results');
      list.append(...shown.map((result) => this._result(result, onPage.includes(result.ref))));
      const none = selection ? 'Nothing carries these tags.' : 'Nothing found that is like what\'s here.';
      this._resultArea.replaceChildren(el('p', 'title', title), shown.length ? list : el('p', 'hint', none));
    }

    // People can ask for a result to be brought onto the page, where the page takes them (pull-in).
    // The page does the bringing, and once it's here, the result says so.
    _pull(ref) {
      this.dispatchEvent(new CustomEvent('sb-pull', { bubbles: true, detail: { ref } }));
      this._keepingFocus(() => this._drawSearch());
    }

    _result({ ref, score, kind, label }, here) {
      const row = el('div', 'result');
      row.dataset.result = ref; // not data-ref: a result isn't part of this page
      const name = document.createElement('span');
      name.append(el('span', 'ref', ref));
      if (kind) name.append(el('span', 'kind', String(kind)));
      row.append(el('span', 'score', Number.isFinite(score) ? score.toFixed(2) : ''), name, el('span', 'summary', label == null ? '' : String(label)));
      if (label) row.title = String(label);
      if (here) row.append(el('span', 'here', 'On this page'));
      else if (this.hasAttribute('pull-in')) row.append(Object.assign(this._button('pull', 'Pull in', `pull:${ref}`, { pull: ref }), { title: `Bring ${ref} onto this page` }));
      return row;
    }
  }

  customElements.define('sb-tags-mode', SbTagsMode);
})();
