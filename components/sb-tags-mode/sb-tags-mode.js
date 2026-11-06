// Sandkit sb-tags-mode 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Tags mode: see what any part of the page is about, and choose topics to keep lit. Pointing at a
// tagged part shows its tags in a card at the side, with what each means; a click holds it. Clicking
// a tag keeps everything carrying it lit, after the mode ends too, until it's cleared. A mode, chosen
// in the shell's picker.
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
    .sb-tags-mode { --sb-tags-mode-tone: var(--sb-warn, #d69e2e); --sb-tags-mode-chosen: var(--sb-tag-focus, color-mix(in srgb, var(--sb-accent, #2563eb) 30%, #c026d3)); display: contents; }
    .sb-tags-mode__frame { position: fixed; inset: 0; margin: 0; padding: 0; border: 0; width: auto; height: auto; background: transparent; box-shadow: inset 0 0 0 4px var(--sb-tags-mode-tone); pointer-events: none; }
    .sb-tags-mode__banner { position: fixed; inset: auto auto 16px 50%; transform: translateX(-50%); margin: 0; display: none; align-items: center; gap: 10px; padding: 6px 8px 6px 14px; border: 2px solid var(--sb-tags-mode-tone); border-radius: 999px; background: color-mix(in srgb, var(--sb-tags-mode-tone) 12%, var(--sb-surface, #fff)); color: var(--sb-text, #1f2933); font: 600 13px var(--sb-font, system-ui, sans-serif); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); }
    .sb-tags-mode__banner:popover-open { display: inline-flex; }
    .sb-tags-mode__button { padding: 5px 12px; border: 1px solid var(--sb-tags-mode-tone); border-radius: var(--sb-radius, 8px); background: color-mix(in srgb, var(--sb-tags-mode-tone) 22%, var(--sb-surface, #fff)); color: var(--sb-text, #1f2933); font: inherit; cursor: pointer; }
    .sb-tags-mode__outline { position: fixed; box-sizing: border-box; margin: 0; padding: 0; border: 2px dashed var(--sb-tags-mode-tone); border-radius: 4px; background: transparent; pointer-events: none; }
    .sb-tags-mode--held .sb-tags-mode__outline { border-style: solid; }
    .sb-tags-mode__card { position: fixed; inset: 72px 16px auto auto; box-sizing: border-box; width: min(340px, calc(100vw - 32px)); max-height: calc(100vh - 150px); margin: 0; padding: 0; flex-direction: column; overflow: hidden; border: 2px solid var(--sb-tags-mode-tone); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 13px/1.45 var(--sb-font, system-ui, sans-serif); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28); }
    .sb-tags-mode__card:popover-open { display: flex; }
    .sb-tags-mode__card:focus { outline: none; }
    .sb-tags-mode__bar { display: flex; flex: none; align-items: center; gap: 10px; padding: 6px 12px; border-bottom: 1px solid var(--sb-border, #d5d9e0); background: var(--sb-surface-2, #eef0f3); cursor: move; touch-action: none; user-select: none; }
    .sb-tags-mode__grip { flex: none; width: 10px; height: 14px; color: var(--sb-muted, #616e7c); background: radial-gradient(circle, currentColor 1.3px, transparent 1.6px) 0 0 / 5px 5px; }
    .sb-tags-mode__body { display: grid; gap: 12px; padding: 10px 12px 12px; overflow-y: auto; }
    .sb-tags-mode__title { margin: 0 0 6px; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .sb-tags-mode__hint { margin: 0; color: var(--sb-muted, #616e7c); }
    .sb-tags-mode__meaning { display: grid; gap: 2px; margin-bottom: 8px; }
    .sb-tags-mode__meaning:last-child { margin-bottom: 0; }
    .sb-tags-mode__meaning > .sb-tags-mode__chip { justify-self: start; }
    .sb-tags-mode__means { margin: 0; color: var(--sb-muted, #616e7c); }
    .sb-tags-mode__chips { display: flex; flex-wrap: wrap; gap: 5px; }
    .sb-tags-mode__chip { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__chip:hover { border-color: var(--sb-tags-mode-chosen); }
    .sb-tags-mode__chip[aria-pressed="true"] { border: 2px dashed var(--sb-tags-mode-chosen); padding: 1px 8px; font-weight: 700; }
    .sb-tags-mode__chip[aria-pressed="true"]::before { content: '✓'; }
    .sb-tags-mode__chip--retired { border-style: dotted; background: transparent; color: var(--sb-muted, #616e7c); cursor: default; text-decoration: line-through; }
    .sb-tags-mode__count { color: var(--sb-muted, #616e7c); font-size: 11px; }
    .sb-tags-mode__mark { margin: 0; color: var(--sb-muted, #616e7c); font-size: 11px; font-style: italic; }
    .sb-tags-mode__lit { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
    .sb-tags-mode__switch { display: inline-flex; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); overflow: hidden; }
    .sb-tags-mode__switch button { padding: 2px 8px; border: 0; background: transparent; color: var(--sb-text, #1f2933); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__switch button[aria-pressed="true"] { background: var(--sb-tags-mode-chosen); color: #fff; font-weight: 700; }
    .sb-tags-mode__clear { padding: 2px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: transparent; color: var(--sb-text, #1f2933); font: 12px var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-tags-mode__quiet { position: fixed; inset: auto auto 16px 16px; box-sizing: border-box; max-width: calc(100vw - 32px); margin: 0; display: none; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding: 6px 10px; border: 1px solid var(--sb-tags-mode-chosen); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 12px var(--sb-font, system-ui, sans-serif); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2); }
    .sb-tags-mode__quiet:popover-open { display: flex; }
    .sb-tags-mode button:focus-visible { outline: 2px solid var(--sb-tags-mode-tone); outline-offset: 1px; }`;

  // Viewers' clicks and presses, stopped in the mode so they hold instead of act.
  const STOPPED = ['click', 'dblclick', 'pointerdown', 'pointerup', 'mousedown', 'mouseup'];

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
      const { tags, match } = JSON.parse(sessionStorage.getItem(MEMORY));
      return { tags: tags.filter((tag) => typeof tag === 'string'), match: match === 'any' ? 'any' : 'all' };
    } catch {
      return { tags: [], match: 'all' };
    }
  }

  function remember(tags, match) {
    try { sessionStorage.setItem(MEMORY, JSON.stringify({ tags, match })); } catch { /* kept in memory only */ }
  }

  class SbTagsMode extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._active = false;
      this._chosen = [];
      this._match = 'all';
      this._shown = null;  // the part whose tags are in the card, or null
      this._held = false;
      this._timer = null;
      this.declarations = null; // what each tag means; the page's TAGS when left unset
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
        const { tags, match } = recall();
        this._chosen = tags;
        this._match = match;
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
      if (!this._built || !this.isConnected) return;
      this._listen(this._active);
      this._frame.togglePopover(this._active);
      this._banner.togglePopover(this._active);
      this._card.togglePopover(this._active);
      if (!this._active) this._letGo();
      this._drawChosen();
      this._drawPage();
      if (starting) this._card.focus({ preventScroll: true });
    }

    // The tags kept lit.
    get chosen() { return [...this._chosen]; }
    set chosen(tags) { this._setChosen(Array.isArray(tags) ? tags.filter((tag) => typeof tag === 'string') : []); }

    // Whether a part needs every chosen tag, or any of them.
    get match() { return this._match; }
    set match(value) {
      this._match = value === 'any' ? 'any' : 'all';
      this._choiceChanged();
    }

    // ---- Building ----

    _render() {
      this.append(
        Object.assign(el('div', 'frame'), { popover: 'manual' }),
        Object.assign(el('div', 'outline'), { popover: 'manual' }),
        Object.assign(el('section', 'card'), { popover: 'manual', tabIndex: -1, ariaLabel: 'Tags' }),
        Object.assign(el('div', 'banner'), { popover: 'manual' }),
        Object.assign(el('section', 'quiet'), { popover: 'manual', ariaLabel: 'Topics kept lit' })
      );
      const part = (name) => this.querySelector(`.sb-tags-mode__${name}`);
      [this._frame, this._outlineBox, this._card, this._banner, this._quiet] = ['frame', 'outline', 'card', 'banner', 'quiet'].map(part);

      const bar = el('div', 'bar');
      bar.title = 'Drag to move';
      bar.append(el('span', 'grip'), el('span', 'title', 'Tags'));
      this._partArea = el('div', 'part');
      this._litArea = el('div', 'chosen');
      this._pageArea = el('div', 'page');
      const body = el('div', 'body');
      body.append(this._partArea, this._litArea, this._pageArea);
      this._card.append(bar, body);
      this._draggable(bar);

      this._words = el('span', 'words', POINTING);
      const stop = el('button', 'button', 'Stop');
      stop.type = 'button';
      stop.addEventListener('click', () => this._end());
      this._banner.append(this._words, stop);

      for (const area of [this._card, this._quiet]) area.addEventListener('click', (e) => this._control(e));
      this._drawPart();
    }

    // The card moves by its bar, so it never has to cover a part someone wants to see.
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
      return this._match === 'any' ? this._chosen.some(has) : this._chosen.every(has);
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
      if (control.dataset.tag) this._toggle(control.dataset.tag);
      else if (control.dataset.match) this.match = control.dataset.match;
      else if (control.dataset.clear != null) this._setChosen([]);
    }

    _toggle(tag) {
      this._setChosen(this._chosen.includes(tag) ? this._chosen.filter((t) => t !== tag) : [...this._chosen, tag]);
    }

    _setChosen(tags) {
      this._chosen = [...new Set(tags)];
      this._choiceChanged();
    }

    _choiceChanged() {
      remember(this._chosen, this._match);
      this._lightChosen();
      if (this._built) this._keepingFocus(() => {
        this._drawPart();
        this._drawChosen();
        this._drawPage();
      });
    }

    // Lighting is the highlighting script's job: this only says what's chosen.
    _lightChosen() {
      this.dispatchEvent(new CustomEvent('sb-tag-focus', { bubbles: true, detail: { tags: this.chosen, match: this._match } }));
    }

    // ---- Drawing ----

    // Redrawing replaces the controls, so keyboard focus goes back to the one that had it.
    _keepingFocus(draw) {
      const key = this.contains(document.activeElement) ? document.activeElement.dataset.key : null;
      draw();
      if (!key) return;
      const control = [...this.querySelectorAll('[data-key]')].find((node) => node.dataset.key === key);
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

    _chip(tag, area, count) {
      const chosen = this._chosen.includes(tag);
      const chip = this._button('chip', tag, `${area}:${tag}`, { tag });
      chip.setAttribute('aria-pressed', String(chosen));
      if (count != null) chip.append(el('span', 'count', String(count)));
      return chip;
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
        row.append(this._chip(tag, 'part'));
        if (!entry && declared.size) row.append(el('p', 'mark', 'Undeclared: nothing says what it means yet'));
      }
      if (entry?.means) row.append(el('p', 'means', entry.means));
      return row;
    }

    // The chosen tags in the card, or outside the mode the quiet bar, with the switch and Clear.
    _drawChosen() {
      const controls = () => {
        const lit = el('div', 'lit');
        if (this._chosen.length > 1) lit.append(this._switch());
        return lit;
      };
      const clear = () => this._button('clear', 'Clear', 'clear', { clear: '' });

      if (this._chosen.length) {
        const count = this._visibleParts().filter((part) => this._carriesChosen(part)).length;
        const lit = controls();
        lit.append(el('span', 'count', `${plural(count, 'part')}${count ? ' · ↑ ↓ to visit' : ''}`), clear());
        this._litArea.replaceChildren(el('p', 'title', 'Kept lit'), lit);
      } else {
        this._litArea.replaceChildren();
      }

      const showQuiet = this._chosen.length > 0 && !this._active;
      if (showQuiet) {
        const chips = el('div', 'chips');
        chips.append(...this._chosen.map((tag) => this._chip(tag, 'quiet')));
        const lit = controls();
        lit.append(clear());
        this._quiet.replaceChildren(el('span', 'title', 'Kept lit'), chips, lit);
      }
      this._quiet.togglePopover(showQuiet);
    }

    _switch() {
      const group = el('span', 'switch');
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', 'Light parts with');
      for (const [match, words] of [['all', 'All tags'], ['any', 'Any tag']]) {
        const button = document.createElement('button');
        Object.assign(button, { type: 'button', textContent: words });
        button.dataset.key = `match:${match}`;
        button.dataset.match = match;
        button.setAttribute('aria-pressed', String(this._match === match));
        group.append(button);
      }
      return group;
    }

    // Every current tag: those found on the page and those declared, most used first. Retired tags
    // are never offered, and a tag no declaration mentions is marked, once there are declarations.
    _drawPage() {
      if (!this._active) return;
      const declared = this._declared();
      const counts = new Map([...declared.keys()].map((tag) => [tag, 0]));
      for (const part of this._tagged()) for (const tag of tagsOf(part)) if (!counts.has(tag)) counts.set(tag, 0);
      for (const part of this._visibleParts()) for (const tag of new Set(tagsOf(part))) counts.set(tag, counts.get(tag) + 1);

      const current = [...counts].filter(([tag]) => !Array.isArray(declared.get(tag)?.replacedBy));
      current.sort(([a, x], [b, y]) => y - x || a.localeCompare(b));
      const chips = el('div', 'chips');
      for (const [tag, count] of current) {
        const chip = this._chip(tag, 'page', count);
        if (declared.get(tag)?.means) chip.title = declared.get(tag).means;
        if (declared.size && !declared.has(tag)) chip.append(el('span', 'mark', 'undeclared'));
        chips.append(chip);
      }
      this._pageArea.replaceChildren(el('p', 'title', 'On this page'), current.length ? chips : el('p', 'hint', 'Nothing here carries a tag yet.'));
    }
  }

  customElements.define('sb-tags-mode', SbTagsMode);
})();
