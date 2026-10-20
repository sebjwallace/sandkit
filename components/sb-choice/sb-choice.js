// Sandkit sb-choice 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A decision as a card: the options weighed with their pros and cons, the one chosen, the reason,
// who decided and when. With `editable`, a group records one in a workshop; the card fires the
// whole decision and keeps nothing itself.
//
//   <sb-choice editable></sb-choice>
//   card.decision = { id: 'DEC-3', title: 'Imagery for flood maps', status: 'accepted', options: [...], chosen: 'b', reason: '...' };
//   card.addEventListener('sb-save', (e) => { save(e.detail.decision); card.decision = e.detail.decision; });
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-choice';
  const existing = customElements.get('sb-choice');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-choice>, so only one can run. Rename one by replacing every "sb-choice" in its file.`);
    }
    return;
  }

  // Three layers: a header band and footer band on --sb-surface-2, the body on --sb-surface,
  // and the options in a well of --sb-bg, so each part reads as its own kind of thing.
  const CSS = `
    .sb-choice { display: block; overflow: hidden; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font-size: 13px; line-height: 1.45; transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s; }
    .sb-choice[data-status="replaced"], .sb-choice[data-status="rejected"] { opacity: 0.6; }
    .sb-choice--highlighted { border-color: var(--sb-accent, #2563eb); box-shadow: 0 0 0 3px var(--sb-accent-soft, #eaf0ff); opacity: 1; }
    .sb-choice__head { padding: 10px 14px; background: var(--sb-surface-2, #eef0f3); border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-choice__heading { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
    .sb-choice__code { flex: none; padding: 1px 7px; border-radius: 999px; background: var(--sb-surface, #fff); color: var(--sb-muted, #616e7c); font: 600 11px ui-monospace, Menlo, Consolas, monospace; }
    .sb-choice__title { font-weight: 600; font-size: 14px; }
    .sb-choice__status { --sb-choice-tone: var(--sb-muted, #616e7c); margin-left: auto; padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; color: var(--sb-choice-tone); background: color-mix(in srgb, var(--sb-choice-tone) 16%, transparent); }
    .sb-choice__status[data-status="proposed"] { --sb-choice-tone: var(--sb-accent, #2563eb); }
    .sb-choice__status[data-status="accepted"] { --sb-choice-tone: var(--sb-good, #3f9142); }
    .sb-choice__status[data-status="rejected"] { --sb-choice-tone: var(--sb-bad, #c53030); }
    .sb-choice__who, .sb-choice__lineage { margin-top: 3px; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-choice__gaps { display: flex; flex-wrap: wrap; gap: 4px 6px; margin: 8px 0 0; padding: 0; list-style: none; }
    .sb-choice__gap { padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; border: 1px dashed currentColor; }
    .sb-choice__gaps[data-tone="warn"] .sb-choice__gap { color: var(--sb-warn, #b7791f); background: color-mix(in srgb, var(--sb-warn, #b7791f) 12%, transparent); }
    .sb-choice__gaps[data-tone="todo"] .sb-choice__gap { color: var(--sb-muted, #616e7c); }
    .sb-choice__body { padding: 4px 14px 12px; }
    .sb-choice__label { margin: 10px 0 4px; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .sb-choice__text { margin: 0; white-space: pre-wrap; }
    .sb-choice__options { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; padding: 8px; border-radius: var(--sb-radius, 8px); background: var(--sb-bg, #f5f6f8); }
    .sb-choice__option { padding: 8px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); transition: background 0.15s, box-shadow 0.15s, opacity 0.15s; }
    .sb-choice[data-has-chosen] .sb-choice__option:not(.sb-choice__option--chosen) { opacity: 0.6; }
    .sb-choice__option--chosen { border: 2px solid var(--sb-good, #3f9142); padding: 7px 9px; background: color-mix(in srgb, var(--sb-good, #3f9142) 10%, var(--sb-surface, #fff)); }
    .sb-choice__option--highlighted { box-shadow: 0 0 0 3px var(--sb-accent, #2563eb); opacity: 1 !important; }
    .sb-choice__option-head { display: flex; align-items: baseline; gap: 6px; font-weight: 600; }
    .sb-choice__chosen { margin-left: auto; padding: 1px 7px; border-radius: 999px; background: var(--sb-good, #3f9142); color: #fff; font-size: 11px; white-space: nowrap; }
    .sb-choice__points { margin: 4px 0 0; padding: 0; list-style: none; font-size: 12px; }
    .sb-choice__point::before { display: inline-block; width: 1.1em; font-weight: 700; }
    .sb-choice__point--pro::before { content: '+'; color: var(--sb-good, #3f9142); }
    .sb-choice__point--con::before { content: '−'; color: var(--sb-bad, #c53030); }
    .sb-choice__reason { margin-top: 10px; padding: 8px 12px; border-left: 3px solid var(--sb-accent, #2563eb); border-radius: 0 var(--sb-radius, 8px) var(--sb-radius, 8px) 0; background: var(--sb-accent-soft, #eaf0ff); }
    .sb-choice__reason .sb-choice__label { margin-top: 0; color: var(--sb-accent, #2563eb); }
    .sb-choice__list { margin: 0; padding-left: 18px; }
    .sb-choice__foot { display: grid; gap: 6px; padding: 8px 14px; background: var(--sb-surface-2, #eef0f3); border-top: 1px solid var(--sb-border, #d5d9e0); }
    .sb-choice__foot .sb-choice__label { margin: 0 6px 0 0; }
    .sb-choice__refs { display: flex; flex-wrap: wrap; gap: 4px 6px; align-items: baseline; }
    .sb-choice__ref { padding: 1px 7px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 999px; background: var(--sb-surface, #fff); color: var(--sb-accent, #2563eb); font: 600 11px ui-monospace, Menlo, Consolas, monospace; cursor: pointer; }
    .sb-choice__ref:hover, .sb-choice__ref--highlighted { background: var(--sb-accent-soft, #eaf0ff); border-color: var(--sb-accent, #2563eb); }
    .sb-choice__quote { color: var(--sb-muted, #616e7c); font-style: italic; }
    .sb-choice__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 12px; }
    .sb-choice__foot .sb-choice__actions { margin-top: 0; }
    .sb-choice__button { padding: 4px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: inherit; cursor: pointer; }
    .sb-choice__button:hover { border-color: var(--sb-accent, #2563eb); }
    .sb-choice__button--main { background: var(--sb-accent, #2563eb); border-color: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #fff); }
    .sb-choice__button--quiet { border-color: transparent; background: transparent; color: var(--sb-muted, #616e7c); }
    .sb-choice__message { color: var(--sb-warn, #b7791f); font-size: 12px; font-weight: 600; }
    .sb-choice__field { display: block; width: 100%; box-sizing: border-box; padding: 4px 6px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 4px; background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: inherit; }
    .sb-choice__heading .sb-choice__field { flex: 1; width: auto; }
    textarea.sb-choice__field { min-height: 3.2em; resize: vertical; }
    .sb-choice__option .sb-choice__field { margin-top: 2px; font-size: 12px; }
    .sb-choice__option > .sb-choice__point { margin-top: 6px; font-size: 12px; color: var(--sb-muted, #616e7c); }
    .sb-choice__pick { display: flex; align-items: center; gap: 4px; font-size: 12px; }
    .sb-choice__people { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-bottom: 4px; }
    .sb-choice__person { display: flex; align-items: center; gap: 4px; }
    .sb-choice__empty { padding: 12px 14px; color: var(--sb-muted, #616e7c); }`;

  const STATUS_WORDS = { proposed: 'Proposed', accepted: 'Accepted', rejected: 'Rejected', replaced: 'Replaced' };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // Now, in the viewer's local time, as `yyyy-mm-ddThh:mm`.
  function now() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // `2026-10-20T14:30` reads as `20 Oct 2026, 14:30`; anything else is shown as given.
  function formatWhen(when) {
    const match = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d:\d\d))?/.exec(when ?? '');
    if (!match) return when;
    const [, year, month, day, time] = match;
    return `${Number(day)} ${MONTHS[month - 1]} ${year}${time ? `, ${time}` : ''}`;
  }

  const lines = (text) => String(text ?? '').split('\n').map((line) => line.trim()).filter(Boolean);

  // The next free option id: a, b, c… skipping any already taken.
  function nextOptionId(options) {
    const taken = new Set(options.map((option) => String(option.id)));
    for (let i = 0; ; i++) {
      const id = i < 26 ? String.fromCharCode(97 + i) : `o${i}`;
      if (!taken.has(id)) return id;
    }
  }

  const hasChosen = (decision) => Boolean(decision.options?.some((option) => option.id === decision.chosen));

  // What a decision is missing, said plainly. An accepted one without these is weaker evidence;
  // a proposed one is simply not finished, so its gaps read as what's still to do.
  function gapsOf(decision) {
    const unchosen = decision.options?.length && !hasChosen(decision);
    if (decision.status === 'accepted') {
      return [
        unchosen && 'No option chosen',
        !decision.reason && 'No reason recorded',
        !decision.deciders?.length && 'Nobody named'
      ].filter(Boolean);
    }
    if (decision.status === 'proposed') {
      return [
        (decision.options?.length || 0) < 2 && 'Only one option so far',
        unchosen && 'To choose',
        !decision.reason && 'No reason yet'
      ].filter(Boolean);
    }
    return [];
  }

  function addStyle() {
    if (document.getElementById('sb-choice-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-choice-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbChoice extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['editable', 'compact'];

    constructor() {
      super();
      this._decision = null;
      this._people = [];
      this._highlight = [];
      this._editing = false;  // the form is open; what's typed lives only in the form until saved
      this._askedReason = false;
      this._unfolded = false; // a compact card opened by the viewer
      this._pointed = null;
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('pointerover', (e) => this._point(e.target));
      this.addEventListener('pointerleave', () => this._point(null));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-choice');
      this.render();
    }

    attributeChangedCallback() {
      this.render();
    }

    // ---- Public API ----

    // { id, title, status, when, deciders, context, options: [{ id, title, pros, cons }], chosen,
    //   reason, consequences, about, sources, replaces, replacedBy }
    get decision() { return this._decision; }
    set decision(value) {
      this._decision = value;
      this._closeForm();
      this.render();
    }

    get editable() { return this.hasAttribute('editable'); }
    set editable(on) { this.toggleAttribute('editable', Boolean(on)); }

    // Names the deciders can be ticked from.
    get people() { return this._people; }
    set people(list) {
      this._people = list || [];
      this.render();
    }

    // Refs to light up: the decision's id, one option (`DEC-3.b`), or a code it's about.
    get highlight() { return this._highlight; }
    set highlight(refs) {
      this._highlight = refs || [];
      this.render();
    }

    // Opens the form, for a new decision the sandbox has just made. Needs `editable`.
    edit() {
      if (!this.editable || !this._decision) return;
      this._editing = true;
      this.render();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      const decision = this._decision;
      this._setRootState(decision);
      if (!decision) {
        this.innerHTML = '<div class="sb-choice__empty">No decision yet.</div>';
        return;
      }
      if (this._editing && this.editable) {
        // Redrawing an open form would lose what's being typed, so it's drawn once.
        if (!this.querySelector('[data-field]')) this.innerHTML = this._form(decision);
        return;
      }
      this.innerHTML = this._card(decision);
    }

    _setRootState(decision) {
      const set = (name, value) => (value == null ? delete this.dataset[name] : (this.dataset[name] = value));
      set('ref', decision?.id);
      set('status', decision?.status);
      set('hasChosen', decision && hasChosen(decision) ? '' : null);
      this.classList.toggle('sb-choice--highlighted', decision?.id != null && this._highlight.includes(decision.id));
    }

    _card(decision) {
      const folded = this.hasAttribute('compact') && !this._unfolded;
      const options = decision.options || [];
      const shown = folded ? options.filter((option) => option.id === decision.chosen) : options;
      return `
        ${this._head(decision)}
        <div class="sb-choice__body">
          ${!folded && decision.context ? this._section('Context', `<p class="sb-choice__text">${esc(decision.context)}</p>`) : ''}
          ${shown.length ? this._section(folded ? 'Chosen' : 'Options', `<div class="sb-choice__options">${shown.map((option) => this._option(decision, option)).join('')}</div>`) : ''}
          ${decision.reason ? `<div class="sb-choice__reason">${this._section('Reason', `<p class="sb-choice__text">${esc(decision.reason)}</p>`)}</div>` : ''}
          ${!folded && decision.consequences?.length ? this._section('Consequences', `<ul class="sb-choice__list">${decision.consequences.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`) : ''}
        </div>
        ${this._foot(decision, folded)}`;
    }

    _head(decision) {
      const status = STATUS_WORDS[decision.status] ? decision.status : null;
      const who = [formatWhen(decision.when), decision.deciders?.length ? decision.deciders.join(', ') : null].filter(Boolean).join(' · ');
      const lineage = [
        decision.replacedBy && `Replaced by ${this._ref(decision.replacedBy)}`,
        decision.replaces && `Replaces ${this._ref(decision.replaces)}`
      ].filter(Boolean).join(' · ');
      return `
        <div class="sb-choice__head">
          <div class="sb-choice__heading">
            ${decision.id != null ? `<span class="sb-choice__code">${esc(decision.id)}</span>` : ''}
            <span class="sb-choice__title">${esc(decision.title)}</span>
            ${status ? `<span class="sb-choice__status" data-status="${status}">${STATUS_WORDS[status]}</span>` : ''}
          </div>
          ${who ? `<div class="sb-choice__who">${esc(who)}</div>` : ''}
          ${lineage ? `<div class="sb-choice__lineage">${lineage}</div>` : ''}
          ${this._gaps(decision)}
        </div>`;
    }

    _gaps(decision) {
      const gaps = gapsOf(decision);
      if (!gaps.length) return '';
      const tone = decision.status === 'accepted' ? 'warn' : 'todo';
      return `<ul class="sb-choice__gaps" data-tone="${tone}">${gaps.map((gap) => `<li class="sb-choice__gap">${esc(gap)}</li>`).join('')}</ul>`;
    }

    _section(label, body) {
      return `<div class="sb-choice__label">${label}</div>${body}`;
    }

    _option(decision, option) {
      const ref = `${decision.id}.${option.id}`;
      const chosen = option.id === decision.chosen;
      const classes = [
        'sb-choice__option',
        chosen ? 'sb-choice__option--chosen' : '',
        this._highlight.includes(ref) ? 'sb-choice__option--highlighted' : ''
      ].filter(Boolean).join(' ');
      const points = (list, kind) => (list || []).map((point) => `<li class="sb-choice__point sb-choice__point--${kind}">${esc(point)}</li>`).join('');
      return `
        <div class="${classes}" data-ref="${esc(ref)}">
          <div class="sb-choice__option-head">
            <span>${esc(option.title)}</span>
            ${chosen ? '<span class="sb-choice__chosen">✓ Chosen</span>' : ''}
          </div>
          <ul class="sb-choice__points">${points(option.pros, 'pro')}${points(option.cons, 'con')}</ul>
        </div>`;
    }

    // What the decision is about, where it came from, and what can be done with it.
    _foot(decision, folded) {
      const rows = [
        !folded && decision.about?.length && `<div class="sb-choice__refs"><span class="sb-choice__label">About</span>${decision.about.map((ref) => this._ref(ref)).join('')}</div>`,
        ...(!folded ? decision.sources || [] : []).map((cite, i) => `
          <div class="sb-choice__refs"><span class="sb-choice__label">${i ? '' : 'Sources'}</span>${this._ref(cite.source)}${cite.quote ? `<span class="sb-choice__quote">“${esc(cite.quote)}”</span>` : ''}</div>`),
        this._actions(decision, folded)
      ].filter(Boolean);
      return rows.length ? `<div class="sb-choice__foot">${rows.join('')}</div>` : '';
    }

    // A code that leads somewhere: the sandbox goes there on `sb-go`.
    _ref(ref) {
      const lit = this._highlight.includes(ref) ? ' sb-choice__ref--highlighted' : '';
      return `<button type="button" class="sb-choice__ref${lit}" data-go="${esc(ref)}">${esc(ref)}</button>`;
    }

    _actions(decision, folded) {
      const buttons = [
        this.hasAttribute('compact') && `<button type="button" class="sb-choice__button sb-choice__button--quiet" data-action="fold">${folded ? 'Show all' : 'Show less'}</button>`,
        this.editable && decision.status === 'proposed' && '<button type="button" class="sb-choice__button" data-action="edit">Edit</button>',
        this.editable && decision.status === 'accepted' && '<button type="button" class="sb-choice__button" data-action="reopen">Reopen</button>'
      ].filter(Boolean);
      return buttons.length ? `<div class="sb-choice__actions">${buttons.join('')}</div>` : '';
    }

    // ---- The form ----

    _form(decision) {
      const others = (decision.deciders || []).filter((name) => !this._people.includes(name));
      return `
        <div class="sb-choice__head">
          <div class="sb-choice__heading">
            ${decision.id != null ? `<span class="sb-choice__code">${esc(decision.id)}</span>` : ''}
            <input class="sb-choice__field" data-field="title" value="${esc(decision.title)}" placeholder="What is being decided" aria-label="Title">
          </div>
          ${decision.replaces ? `<div class="sb-choice__lineage">Replaces ${esc(decision.replaces)}</div>` : ''}
        </div>
        <div class="sb-choice__body">
          ${this._section('Context', `<textarea class="sb-choice__field" data-field="context" placeholder="What led to this">${esc(decision.context)}</textarea>`)}
          ${this._section('Options', `<div class="sb-choice__options">${(decision.options || []).map((option) => this._optionForm(decision, option)).join('')}</div>
            <div class="sb-choice__actions"><button type="button" class="sb-choice__button" data-action="add-option">Add option</button></div>`)}
          ${this._section('Reason', `<textarea class="sb-choice__field" data-field="reason" placeholder="Why this option">${esc(decision.reason)}</textarea>`)}
          ${this._section('Consequences', `<textarea class="sb-choice__field" data-field="consequences" placeholder="What follows, one per line">${esc((decision.consequences || []).join('\n'))}</textarea>`)}
          ${this._section('Deciders', `
            <div class="sb-choice__people">${this._people.map((name) => `
              <label class="sb-choice__person"><input type="checkbox" data-person="${esc(name)}"${decision.deciders?.includes(name) ? ' checked' : ''}> ${esc(name)}</label>`).join('')}</div>
            <input class="sb-choice__field" data-field="others" value="${esc(others.join(', '))}" placeholder="${this._people.length ? 'Anyone else, separated by commas' : 'Names, separated by commas'}" aria-label="Other deciders">`)}
        </div>
        <div class="sb-choice__foot">
          <div class="sb-choice__actions">
            <button type="button" class="sb-choice__button sb-choice__button--main" data-action="accept">Accept</button>
            <button type="button" class="sb-choice__button" data-action="propose">Propose</button>
            <button type="button" class="sb-choice__button sb-choice__button--quiet" data-action="cancel">Cancel</button>
            <span class="sb-choice__message" role="status"></span>
          </div>
        </div>`;
    }

    _optionForm(decision, option) {
      return `
        <div class="sb-choice__option" data-option="${esc(option.id)}">
          <input class="sb-choice__field" data-part="title" value="${esc(option.title)}" placeholder="Option" aria-label="Option">
          <div class="sb-choice__point sb-choice__point--pro">Pros</div>
          <textarea class="sb-choice__field" data-part="pros" placeholder="One per line" aria-label="Pros">${esc((option.pros || []).join('\n'))}</textarea>
          <div class="sb-choice__point sb-choice__point--con">Cons</div>
          <textarea class="sb-choice__field" data-part="cons" placeholder="One per line" aria-label="Cons">${esc((option.cons || []).join('\n'))}</textarea>
          <div class="sb-choice__actions">
            <label class="sb-choice__pick"><input type="radio" name="${this._radioName()}" value="${esc(option.id)}"${option.id === decision.chosen ? ' checked' : ''}> Chosen</label>
            <button type="button" class="sb-choice__button sb-choice__button--quiet" data-action="remove-option">Remove</button>
          </div>
        </div>`;
    }

    // Radio groups are page-wide, so each card needs a name of its own.
    _radioName() {
      this._radio ??= `sb-choice-${Math.random().toString(36).slice(2)}`;
      return this._radio;
    }

    // The decision as the form now stands, over the one the card was given.
    _read() {
      const field = (name) => this.querySelector(`[data-field="${name}"]`)?.value.trim() ?? '';
      const options = [...this.querySelectorAll('[data-option]')].map((el) => ({
        id: el.dataset.option,
        title: el.querySelector('[data-part="title"]').value.trim(),
        pros: lines(el.querySelector('[data-part="pros"]').value),
        cons: lines(el.querySelector('[data-part="cons"]').value)
      }));
      const ticked = [...this.querySelectorAll('[data-person]:checked')].map((el) => el.dataset.person);
      const others = field('others').split(',').map((name) => name.trim()).filter(Boolean);
      return {
        ...this._decision,
        title: field('title'),
        context: field('context'),
        options,
        chosen: this.querySelector(`input[name="${this._radioName()}"]:checked`)?.value ?? null,
        reason: field('reason'),
        consequences: lines(field('consequences')),
        deciders: [...new Set([...ticked, ...others])]
      };
    }

    _closeForm() {
      this._editing = false;
      this._askedReason = false;
    }

    // ---- Viewers ----

    _click(e) {
      const go = e.target.closest('[data-go]');
      if (go) return this._fire('sb-go', { ref: go.dataset.go });
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) this._act(action, e.target);
    }

    _act(action, target) {
      if (action === 'fold') { this._unfolded = !this._unfolded; this.render(); }
      if (action === 'edit') this.edit();
      if (action === 'reopen') this._fire('sb-reopen', { id: this._decision.id });
      if (action === 'cancel') { this._closeForm(); this.render(); }
      if (action === 'add-option' || action === 'remove-option') this._reshape(action, target);
      if (action === 'propose' || action === 'accept') this._save(action === 'accept' ? 'accepted' : 'proposed');
    }

    // Adding or removing an option redraws the form, keeping what's been typed.
    _reshape(action, target) {
      const draft = this._read();
      if (action === 'add-option') draft.options.push({ id: nextOptionId(draft.options), title: '', pros: [], cons: [] });
      else draft.options = draft.options.filter((option) => option.id !== target.closest('[data-option]').dataset.option);
      this.innerHTML = this._form(draft);
    }

    // Accepting needs a chosen option, and a missing reason is asked about once before it goes through.
    // Each save is a stage of its own, so it's stamped with the time it was made.
    _save(status) {
      const decision = { ...this._read(), status, when: now() };
      const message = this.querySelector('.sb-choice__message');
      if (status === 'accepted' && !hasChosen(decision)) {
        message.textContent = 'Choose an option before accepting.';
        return;
      }
      if (status === 'accepted' && !decision.reason && !this._askedReason) {
        this._askedReason = true;
        message.textContent = 'No reason given. Press Accept again to accept without one.';
        return;
      }
      this._closeForm();
      this.render();
      this._fire('sb-save', { decision });
    }

    // Pointing at the card, an option or a code announces its ref; leaving announces null.
    _point(target) {
      const el = target?.closest?.('[data-go], [data-ref]');
      const ref = el && this.contains(el) ? (el.dataset.go ?? el.dataset.ref) : null;
      if (ref === this._pointed) return;
      this._pointed = ref;
      this._fire('sb-point', { ref });
    }

    _fire(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    }
  }

  customElements.define('sb-choice', SbChoice);
})();
