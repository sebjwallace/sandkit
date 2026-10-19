// Sandkit sb-comments 0.2.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// Comments from the people exploring a sandbox, each citing what it's about, sent back as one
// markdown text. In comment mode, a click picks rather than acts: the component reports where,
// the sandbox answers with the refs there, and the viewer writes what they think. Saved comments
// gather in a tray, to copy as a prompt or download as a file.
//
//   <sb-comments id="feedback" slot="modes"></sb-comments>      chosen in the shell's mode picker
//   comments.context = { title: 'Checkout', version: '0.4.0', goal: 'See how a checkout is built.' };
//   comments.addEventListener('sb-pick', (e) => comments.pick(refsAt(e.detail.x, e.detail.y)));
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-comments';
  const existing = customElements.get('sb-comments');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-comments>, so only one can run. Rename one by replacing every "sb-comments" in its file.`);
    }
    return;
  }

  // The dimming, banner, outlines, comment box and tray sit in the browser's top layer (the popover
  // API), above everything on the page. The dimming only dims: in comment mode the component stops
  // the page's clicks itself, so what's under the pointer can still be found.
  //
  // Everything about commenting wears its own colour, the theme's warning amber, like a reviewer's
  // notes, so it never blends with the sandbox it comments on.
  const CSS = `
    .sb-comments { --sb-comments-tone: var(--sb-warn, #d69e2e); --sb-comments-tint: color-mix(in srgb, var(--sb-comments-tone) 12%, var(--sb-surface, #fff)); display: contents; }
    .sb-comments__button { padding: 5px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: inherit; font-size: 13px; cursor: pointer; }
    .sb-comments__button[aria-pressed="true"], .sb-comments__button--primary { border-color: var(--sb-comments-tone); background: color-mix(in srgb, var(--sb-comments-tone) 22%, var(--sb-surface, #fff)); font-weight: 600; }
    .sb-comments__button:disabled { opacity: 0.45; cursor: default; }
    .sb-comments__button:focus-visible { outline: 2px solid var(--sb-comments-tone); outline-offset: 1px; }
    .sb-comments__count { color: var(--sb-muted, #616e7c); font-weight: normal; }
    .sb-comments__count:empty { display: none; }
    .sb-comments__dim { position: fixed; inset: 0; margin: 0; padding: 0; border: 0; width: auto; height: auto; background: var(--sb-comments-dim, rgba(0, 0, 0, 0.12)); box-shadow: inset 0 0 0 4px var(--sb-comments-tone); pointer-events: none; }
    .sb-comments__banner { position: fixed; inset: auto auto 16px 50%; transform: translateX(-50%); margin: 0; display: none; align-items: center; gap: 10px; padding: 6px 8px 6px 14px; border: 2px solid var(--sb-comments-tone); border-radius: 999px; background: var(--sb-comments-tint); color: var(--sb-text, #1f2933); font: 600 13px var(--sb-font, system-ui, sans-serif); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); }
    .sb-comments__banner:popover-open { display: inline-flex; }
    .sb-comments__outlines { position: fixed; inset: 0; margin: 0; padding: 0; border: 0; width: auto; height: auto; background: none; pointer-events: none; overflow: visible; }
    .sb-comments__outline { position: fixed; border: 2px dashed var(--sb-comments-tone); border-radius: 4px; background: color-mix(in srgb, var(--sb-comments-tone) 10%, transparent); }
    .sb-comments__box, .sb-comments__tray { position: fixed; margin: 0; padding: 12px 14px; border: 2px solid var(--sb-comments-tone); border-radius: var(--sb-radius, 8px); background: var(--sb-comments-tint); color: var(--sb-text, #1f2933); font: 13px/1.5 var(--sb-font, system-ui, sans-serif); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
    .sb-comments__box { inset: auto; width: min(320px, calc(100vw - 24px)); }
    .sb-comments__tray { inset: 56px 12px auto auto; width: min(380px, calc(100vw - 24px)); max-height: calc(100vh - 68px); overflow: auto; }
    .sb-comments__head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
    .sb-comments__title { flex: 1; font-weight: 600; }
    .sb-comments__about { margin-bottom: 8px; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-comments__kinds { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-bottom: 6px; }
    .sb-comments__kinds label { display: inline-flex; gap: 4px; align-items: center; }
    .sb-comments__kinds input { accent-color: var(--sb-comments-tone); }
    .sb-comments__text, .sb-comments__author, .sb-comments__copy-text { box-sizing: border-box; width: 100%; padding: 6px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: inherit; font: inherit; }
    .sb-comments__text:focus, .sb-comments__author:focus { outline: 2px solid var(--sb-comments-tone); outline-offset: 0; }
    .sb-comments__text { min-height: 72px; resize: vertical; }
    .sb-comments__copy-text { min-height: 120px; font: 12px/1.4 ui-monospace, Menlo, Consolas, monospace; }
    .sb-comments__actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .sb-comments__actions--end { justify-content: flex-end; margin-top: 14px; }
    .sb-comments__list { display: grid; gap: 8px; margin: 10px 0; padding: 0; list-style: none; }
    .sb-comments__item { padding: 8px 10px; border: 1px solid color-mix(in srgb, var(--sb-comments-tone) 45%, var(--sb-border, #d5d9e0)); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); }
    .sb-comments__item-head { color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-comments__item-text { margin: 2px 0 4px; white-space: pre-wrap; }
    .sb-comments__link { padding: 0; border: 0; background: none; color: var(--sb-text, #1f2933); font: inherit; font-size: 12px; text-decoration: underline; cursor: pointer; }
    .sb-comments__note { margin: 8px 0 0; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-comments__empty { color: var(--sb-muted, #616e7c); }`;

  const KINDS = ['question', 'correction', 'idea', 'unclear'];
  const MARGIN = 12;  // the least room kept between a box and the window's edge
  const GAP = 8;      // between a picked part and the comment box
  const CLIPBOARD_WAIT_MS = 500;

  // Viewers' clicks and presses, stopped in comment mode so they pick instead of act.
  const STOPPED = ['click', 'dblclick', 'pointerdown', 'pointerup', 'mousedown', 'mouseup'];

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const capitalise = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const clamp = (value, low, high) => Math.min(Math.max(value, low), Math.max(low, high));
  const today = () => new Date().toISOString().slice(0, 10);

  // A comment's text, kept as text in markdown: a line can't become a heading or a list.
  const asText = (text) => String(text ?? '').split('\n').map((line) => line.replace(/^(\s*)([#>*+-])/, '$1\\$2').replace(/^(\s*\d+)\./, '$1\\.')).join('\n');

  function addStyle() {
    if (document.getElementById('sb-comments-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-comments-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  let instanceCount = 0; // gives each instance unique ids for its labels and radio groups

  class SbComments extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._id = `sb-comments-${++instanceCount}`;
      this._comments = [];
      this._next = 1;          // numbers only go up, so a deleted comment's number is never reused
      this._author = '';
      this._active = false;
      this._draft = null;      // { refs, view, elements, n } while the comment box is open
      this._adding = false;    // whether the pick being answered adds to the open comment
      this.context = {};
      this.snapshot = null;
      this.kinds = KINDS;
      this._stop = (e) => this._intercept(e);
      this._escape = (e) => { if (e.key === 'Escape') this._onEscape(e); };
      this._follow = () => this._placeDraft();
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-comments');
      if (this._built) return;
      this._built = true;
      this._render();
    }

    disconnectedCallback() {
      this._listen(false);
    }

    // ---- Public API ----

    // The mode's name, in the shell's mode picker.
    get heading() { return this.getAttribute('heading') || 'Comment'; }

    // Whether comment mode is on. Setting it fires no event: sb-mode reports the viewer's choices.
    // However a session ends, its comments are put in front of the viewer to send.
    get active() { return this._active; }
    set active(on) {
      const ending = this._active && !on;
      this._active = Boolean(on);
      if (!this._built) return;
      if (ending) this._closeBox();
      this._listen(this._active || this._boxOpen);
      this._dim.togglePopover(this._active);
      this._banner.togglePopover(this._active);
      if (!this._active && !this._boxOpen) this._clearOutlines();
      if (ending && this._comments.length) this._openTray();
    }

    // Answers an sb-pick: { refs, view, element }, or null for nothing there.
    pick(picked) {
      const refs = picked?.refs ?? [];
      const element = picked?.element ?? null;
      if (this._adding && this._draft) {
        this._draft.refs = [...new Set([...this._draft.refs, ...refs])];
        if (element) this._draft.elements.push(element);
        this._draft.view ??= picked?.view ?? null;
      } else {
        this._draft = { refs: [...refs], view: picked?.view ?? null, elements: element ? [element] : [], n: null };
      }
      this._adding = false;
      this._openBox();
    }

    get comments() { return this._comments.map((c) => ({ ...c })); }
    set comments(list) {
      this._comments = (list || []).map((c) => ({ ...c }));
      this._next = Math.max(this._next, ...this._comments.map((c) => c.n + 1));
      this._changed();
    }

    // Remove every comment; numbering starts again at #1.
    clear() {
      this._comments = [];
      this._next = 1;
      this._changed();
    }

    // The comments as markdown: one text for a prompt or a file.
    toMarkdown() {
      const { title, version, goal } = this.context ?? {};
      const from = [this._author && `From ${this._author}`, today()].filter(Boolean).join(', ');
      const lines = [
        `# Feedback on ${title || 'this sandbox'}${version ? ` (version ${version})` : ''}`,
        '',
        `${from}.${goal ? ` Goal: ${goal}` : ''}`,
        '',
        'Please read this sandbox\'s journal practice, address each comment below, and cite the comments you address in the journal entry\'s **Why**.'
      ];
      for (const c of this._comments) {
        lines.push('', `## ${[`#${c.n}`, capitalise(c.kind), c.refs.join(', '), c.view].filter(Boolean).join(' · ')}`, asText(c.text));
        const state = Object.entries(c.state ?? {}).map(([key, value]) => `${key} ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        if (state.length) lines.push(`State: ${state.join(', ')}.`);
      }
      return lines.join('\n') + '\n';
    }

    // ---- Building ----

    _render() {
      this.innerHTML = `
        <div class="sb-comments__dim" popover="manual"></div>
        <div class="sb-comments__banner" popover="manual">
          <span>Commenting: click anything to comment on it</span>
          <span class="sb-comments__count"></span>
          <button type="button" class="sb-comments__button" data-action="discard" title="Stop, and forget these comments">Cancel</button>
          <button type="button" class="sb-comments__button sb-comments__button--primary" data-action="done">Done</button>
        </div>
        <div class="sb-comments__outlines" popover="manual"></div>
        <div class="sb-comments__box" popover="manual" role="dialog" aria-labelledby="${this._id}-box-title"></div>
        <div class="sb-comments__tray" popover="manual" data-modes role="dialog" aria-labelledby="${this._id}-tray-title"></div>`;
      this._dim = this.querySelector('.sb-comments__dim');
      this._banner = this.querySelector('.sb-comments__banner');
      this._outlines = this.querySelector('.sb-comments__outlines');
      this._box = this.querySelector('.sb-comments__box');
      this._tray = this.querySelector('.sb-comments__tray');
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('input', (e) => this._input(e));
      this._box.addEventListener('keydown', (e) => { if (e.key === 'Escape') this._onEscape(e); });
      this._showCount();
    }

    // ---- Comment mode and picking ----

    get _boxOpen() { return this._built && this._box.matches(':popover-open'); }

    _listen(on) {
      for (const type of STOPPED) {
        if (on) addEventListener(type, this._stop, true);
        else removeEventListener(type, this._stop, true);
      }
      if (on) addEventListener('keydown', this._escape, true);
      else removeEventListener('keydown', this._escape, true);
    }

    // In comment mode, a click anywhere but the component's own parts, or what every mode lets
    // through (data-modes, such as the shell's mode picker), picks instead of acting.
    _intercept(e) {
      if (!this._active || this.contains(e.target) || e.target.closest?.('[data-modes]')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.type !== 'click') return;
      this._adding = e.shiftKey && Boolean(this._draft);
      this._fire('sb-pick', { x: e.clientX, y: e.clientY, add: e.shiftKey });
    }

    _setMode(on) {
      this.active = on;
      this._fire('sb-mode', { mode: this.heading, active: this._active });
    }

    // Escape only closes the comment box, so a stray key never ends a session or loses comments.
    _onEscape(e) {
      if (!this._boxOpen) return;
      e.preventDefault();
      this._closeBox();
    }

    // Cancel: as if nothing had happened.
    _discard() {
      this._closeBox();
      this.clear();
      this._setMode(false);
    }

    // Done: commenting ends, and what's been written is ready to send.
    _finish() {
      this._setMode(false);
      this._openTray();
    }

    // Done again, once sent: everything is cleared, back to a clean page.
    _close() {
      this._tray.hidePopover();
      this.clear();
    }

    // ---- The comment box ----

    _openBox() {
      const d = this._draft, editing = d.n != null ? this._comments.find((c) => c.n === d.n) : null;
      const cites = [d.refs.join(', '), d.view].filter(Boolean).join(' · ');
      const kinds = this.kinds.map((kind, i) => `
        <label><input type="radio" name="${this._id}-kind" value="${esc(kind)}"${(editing ? editing.kind === kind : i === 0) ? ' checked' : ''}> ${esc(capitalise(kind))}</label>`).join('');
      this._box.innerHTML = `
        <div class="sb-comments__title" id="${this._id}-box-title">${editing ? `Edit #${editing.n}` : 'New comment'}</div>
        <div class="sb-comments__about">${cites ? `About ${esc(cites)}` : 'A general comment'}${this._active && !editing ? '. Shift-click to add more.' : ''}</div>
        <div class="sb-comments__kinds">${kinds}</div>
        <textarea class="sb-comments__text" aria-label="Your comment" placeholder="What do you think?">${esc(editing?.text ?? '')}</textarea>
        <div class="sb-comments__actions">
          <button type="button" class="sb-comments__button sb-comments__button--primary" data-action="save"${editing?.text ? '' : ' disabled'}>Save</button>
          <button type="button" class="sb-comments__button" data-action="cancel">Cancel</button>
        </div>`;
      if (!this._boxOpen) this._box.showPopover();
      this._outlines.showPopover();
      this._listen(true);
      addEventListener('scroll', this._follow, true);
      addEventListener('resize', this._follow);
      this._placeDraft();
      this._box.querySelector('textarea').focus({ preventScroll: true });
    }

    _closeBox() {
      this._draft = null;
      if (this._boxOpen) this._box.hidePopover();
      removeEventListener('scroll', this._follow, true);
      removeEventListener('resize', this._follow);
      this._clearOutlines();
      this._listen(this._active);
    }

    _clearOutlines() {
      this._outlines.replaceChildren();
      if (this._outlines.matches(':popover-open')) this._outlines.hidePopover();
    }

    // Outlines round each picked part, and the box beside the last, below it or above, on screen.
    _placeDraft() {
      if (!this._draft) return;
      const rects = this._draft.elements.filter((el) => el.isConnected).map((el) => el.getBoundingClientRect());
      this._outlines.replaceChildren(...rects.map((r) => Object.assign(document.createElement('div'), {
        className: 'sb-comments__outline',
        style: `left: ${r.left - 3}px; top: ${r.top - 3}px; width: ${r.width + 6}px; height: ${r.height + 6}px`
      })));
      const box = this._box.getBoundingClientRect(), part = rects.at(-1);
      const left = part ? part.left : (innerWidth - box.width) / 2;
      const top = !part ? (innerHeight - box.height) / 2 : part.bottom + GAP + box.height <= innerHeight - MARGIN ? part.bottom + GAP : part.top - GAP - box.height;
      Object.assign(this._box.style, {
        left: `${clamp(left, MARGIN, innerWidth - box.width - MARGIN)}px`,
        top: `${clamp(top, MARGIN, innerHeight - box.height - MARGIN)}px`
      });
    }

    _save() {
      const d = this._draft;
      const text = this._box.querySelector('textarea').value.trim();
      const kind = this._box.querySelector('input[type="radio"]:checked')?.value ?? this.kinds[0];
      let comment = this._comments.find((c) => c.n === d.n);
      if (comment) Object.assign(comment, { text, kind });
      else {
        comment = {
          n: this._next++, kind, text, refs: d.refs, view: d.view,
          state: typeof this.snapshot === 'function' ? structuredClone(this.snapshot()) : null,
          author: this._author || null, time: new Date().toISOString()
        };
        this._comments.push(comment);
      }
      this._closeBox();
      this._changed();
      this._fire('sb-comment', { comment: { ...comment } });
    }

    // ---- The tray ----

    _showCount() {
      const n = this._comments.length;
      this.querySelector('.sb-comments__count').textContent = n ? `${n} comment${n === 1 ? '' : 's'}` : '';
    }

    _openTray() {
      this._renderTray();
      if (!this._tray.matches(':popover-open')) this._tray.showPopover();
    }

    _renderTray() {
      const items = this._comments.map((c) => `
        <li class="sb-comments__item">
          <div class="sb-comments__item-head">${esc([`#${c.n}`, capitalise(c.kind), c.refs.join(', '), c.view].filter(Boolean).join(' · '))}</div>
          <div class="sb-comments__item-text">${esc(c.text)}</div>
          <button type="button" class="sb-comments__link" data-action="edit" data-n="${c.n}">Edit</button>
          <button type="button" class="sb-comments__link" data-action="delete" data-n="${c.n}">Delete</button>
        </li>`).join('');
      const none = !this._comments.length;
      this._tray.innerHTML = `
        <div class="sb-comments__head"><div class="sb-comments__title" id="${this._id}-tray-title">Your comments</div></div>
        <label class="sb-comments__about">Your name <input class="sb-comments__author" value="${esc(this._author)}" placeholder="Optional"></label>
        ${items ? `<ul class="sb-comments__list">${items}</ul>` : '<p class="sb-comments__empty">No comments yet.</p>'}
        <div class="sb-comments__actions">
          <button type="button" class="sb-comments__button" data-action="copy"${none ? ' disabled' : ''}>Copy as prompt</button>
          <button type="button" class="sb-comments__button" data-action="download"${none ? ' disabled' : ''}>Download</button>
          <button type="button" class="sb-comments__button" data-action="general">Add a general comment</button>
        </div>
        <div class="sb-comments__copy" hidden>
          <p class="sb-comments__note">Copying isn't allowed here. Press Ctrl+C (⌘C on a Mac) to copy the selected text.</p>
          <textarea class="sb-comments__copy-text" readonly aria-label="Your comments as text"></textarea>
        </div>
        <div class="sb-comments__actions sb-comments__actions--end">
          <button type="button" class="sb-comments__button" data-action="resume">Keep commenting</button>
          <button type="button" class="sb-comments__button sb-comments__button--primary" data-action="close" title="Clear these comments and finish">Done</button>
        </div>
        <p class="sb-comments__note">Done clears these comments, so copy or download them first.</p>`;
    }

    // Copies the comments as a prompt, or shows them selected to copy by hand where the
    // clipboard is refused, or doesn't answer in time (as when a permission prompt waits unseen).
    async _copy() {
      const text = this.toMarkdown();
      const noAnswer = new Promise((_, reject) => setTimeout(reject, CLIPBOARD_WAIT_MS));
      try {
        await Promise.race([navigator.clipboard.writeText(text), noAnswer]);
      } catch {
        const area = this._tray.querySelector('.sb-comments__copy');
        area.hidden = false;
        area.querySelector('textarea').value = text;
        area.querySelector('textarea').select();
      }
    }

    // A data link, so it works offline and in a single-file sandbox.
    _download() {
      const slug = String(this.context?.title || 'sandbox').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const link = Object.assign(document.createElement('a'), {
        href: `data:text/markdown;charset=utf-8,${encodeURIComponent(this.toMarkdown())}`,
        download: `feedback-${slug}-${today()}.md`
      });
      link.click();
    }

    // ---- Viewers ----

    _click(e) {
      const button = e.target.closest('[data-action]');
      if (!button) return;
      const n = Number(button.dataset.n);
      const actions = {
        discard: () => this._discard(),
        done: () => this._finish(),
        resume: () => { this._tray.hidePopover(); this._setMode(true); },
        close: () => this._close(),
        save: () => this._save(),
        cancel: () => this._closeBox(),
        general: () => { this._draft = { refs: [], view: null, elements: [], n: null }; this._openBox(); },
        edit: () => { const c = this._comments.find((x) => x.n === n); this._draft = { refs: c.refs, view: c.view, elements: [], n }; this._openBox(); },
        delete: () => { this._comments = this._comments.filter((c) => c.n !== n); this._changed(); },
        copy: () => this._copy(),
        download: () => this._download()
      };
      actions[button.dataset.action]?.();
    }

    _input(e) {
      if (e.target.matches('.sb-comments__text')) this._box.querySelector('[data-action="save"]').disabled = !e.target.value.trim();
      if (e.target.matches('.sb-comments__author')) {
        this._author = e.target.value.trim();
      }
    }

    _changed() {
      if (!this._built) return;
      this._showCount();
      if (this._tray.matches(':popover-open')) this._renderTray();
    }

    _fire(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    }
  }

  customElements.define('sb-comments', SbComments);
})();
