// Sandkit sb-poll 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// A question put to a group: each person answers, every answer hidden until everyone has, then
// all are revealed at once, grouped by option, so nobody's answer steers anyone else's. With an
// outcome, it's a prediction: the option that held is marked, and so is who expected it.
//
//   <sb-poll question="How many homes flood?" reasons>
//     <img slot="option:many" src="many.png" alt="Most homes under water">
//   </sb-poll>
//   poll.options = [{ id: 'none', label: 'None' }, { id: 'many', label: 'Over 200' }];
//   poll.people = [{ id: 'priya', name: 'Priya Shah' }];
//   poll.addEventListener('sb-answer', (e) => { answers[e.detail.person] = e.detail; poll.answers = answers; });
//   poll.addEventListener('sb-reveal', () => { poll.revealed = true; });
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-poll';
  const existing = customElements.get('sb-poll');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-poll>, so only one can run. Rename one by replacing every "sb-poll" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-poll { display: grid; gap: 12px; padding: 14px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: 14px/1.45 var(--sb-font, system-ui, sans-serif); }
    .sb-poll__question { margin: 0; font-size: 15px; font-weight: 700; }
    .sb-poll__people { display: flex; flex-wrap: wrap; gap: 8px; }
    .sb-poll__person { display: inline-flex; flex-direction: column; gap: 2px; }
    .sb-poll__person--waiting { opacity: 0.55; }
    .sb-poll__name { font-weight: 600; }
    .sb-poll__status { color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-poll__form { display: grid; gap: 10px; padding: 12px; border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); }
    .sb-poll__form select, .sb-poll__form textarea { font: inherit; padding: 4px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); }
    .sb-poll__form textarea { min-height: 2.6em; resize: vertical; }
    .sb-poll__form select { justify-self: start; max-width: 100%; }
    .sb-poll__label { display: grid; gap: 4px; font-size: 13px; color: var(--sb-muted, #616e7c); }
    .sb-poll__options { display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--sb-poll-option-width, 150px), 1fr)); gap: 8px; }
    .sb-poll__option { display: grid; gap: 6px; align-content: start; padding: 8px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: var(--sb-text, #1f2933); font: inherit; text-align: left; cursor: pointer; }
    .sb-poll__option[aria-pressed="true"] { border-color: var(--sb-accent, #2563eb); outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -1px; }
    .sb-poll__option-label { font-weight: 600; }
    .sb-poll__option--highlighted, .sb-poll__group--highlighted { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-poll__button { justify-self: start; padding: 4px 12px; border: 1px solid var(--sb-accent, #2563eb); border-radius: var(--sb-radius, 8px); background: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #fff); font: inherit; font-size: 13px; cursor: pointer; }
    .sb-poll__button:disabled { opacity: 0.4; cursor: default; }
    .sb-poll__foot { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; color: var(--sb-muted, #616e7c); font-size: 13px; }
    .sb-poll__summary { margin: 0; font-weight: 600; }
    .sb-poll__groups { display: grid; gap: 8px; }
    .sb-poll__group { display: grid; gap: 8px; padding: 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); }
    .sb-poll__group--outcome { border-color: var(--sb-good, #3f9142); box-shadow: inset 3px 0 0 var(--sb-good, #3f9142); }
    .sb-poll__group-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .sb-poll__count { color: var(--sb-muted, #616e7c); font-size: 13px; font-variant-numeric: tabular-nums; }
    .sb-poll__held { padding: 1px 8px; border-radius: 999px; background: var(--sb-good, #3f9142); color: var(--sb-surface, #fff); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .sb-poll__answer { display: grid; gap: 4px; }
    .sb-poll__mark { font-weight: 700; }
    .sb-poll__mark--right { color: var(--sb-good, #3f9142); }
    .sb-poll__mark--wrong { color: var(--sb-bad, #c53030); }
    .sb-poll__answer-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .sb-poll__why { margin: 0 0 0 4px; padding-left: 10px; border-left: 3px solid var(--sb-border, #d5d9e0); color: var(--sb-muted, #616e7c); font-style: italic; }
    .sb-poll__note { margin: 0 0 0 4px; padding: 6px 10px; border-radius: var(--sb-radius, 8px); background: var(--sb-accent-soft, #eaf0ff); }
    .sb-poll__nobody { color: var(--sb-muted, #616e7c); font-size: 13px; }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const announce = (ref) => document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref } }));
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  function addStyle() {
    if (document.getElementById('sb-poll-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-poll-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  let instanceCount = 0; // gives each poll unique ids for its labels

  class SbPoll extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['question', 'reasons'];

    constructor() {
      super();
      this._id = `sb-poll-${++instanceCount}`;
      this._options = [];
      this._people = [];
      this._answers = {};
      this._notes = {};
      this._revealed = false;
      this._outcome = null;
      this._highlight = [];
      this._draft = {}; // the answer being written: { person, option, why }
      this._slotted = new Map(); // the sandbox's content, by slot name: option:<id> and person:<id>
      this._observer = new MutationObserver(() => this.render());
      this._onHighlight = (e) => { this.highlight = e.detail?.ref ? [e.detail.ref] : []; };
      this.addEventListener('click', (e) => this._onClick(e));
      this.addEventListener('input', (e) => this._onInput(e));
      this.addEventListener('change', (e) => this._onInput(e));
      this.addEventListener('submit', (e) => this._onSubmit(e));
      this.addEventListener('pointerover', (e) => this._point(e));
      this.addEventListener('pointerleave', () => { if (this._pointing) announce((this._pointing = null)); });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-poll');
      document.addEventListener('sb-highlight', this._onHighlight);
      this.render();
      this._observer.observe(this, { childList: true });
    }

    disconnectedCallback() {
      this._observer.disconnect();
      document.removeEventListener('sb-highlight', this._onHighlight);
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ id, label, ref }]: what people choose between. Content slotted as option:<id> shows in place of the label.
    get options() { return this._options; }
    set options(list) { this._options = list || []; this.render(); }

    // [{ id, name, role }]: who is answering. Content slotted as person:<id> shows in place of the name.
    get people() { return this._people; }
    set people(list) { this._people = list || []; this.render(); }

    // { [person]: { option, why } }: the answers given, kept by the sandbox and set here.
    get answers() { return this._answers; }
    set answers(value) { this._answers = { ...(value || {}) }; this.render(); }

    // Whether the answers are shown. The poll asks with sb-reveal; the sandbox sets this.
    get revealed() { return this._revealed; }
    set revealed(value) { this._revealed = Boolean(value); this.render(); }

    // The option that held, which makes the poll a prediction. Shown once revealed.
    get outcome() { return this._outcome; }
    set outcome(id) { this._outcome = id ?? null; this.render(); }

    // { [person]: text }: a reply to each answer, such as an agent's, shown under it once revealed.
    get notes() { return this._notes; }
    set notes(value) { this._notes = { ...(value || {}) }; this.render(); }

    // Refs of options to light up.
    get highlight() { return this._highlight; }
    set highlight(refs) {
      this._highlight = (refs || []).map(String);
      for (const el of this.querySelectorAll('[data-option-ref]')) {
        const lit = this._highlight.includes(el.dataset.optionRef);
        el.classList.toggle(el.classList.contains('sb-poll__group') ? 'sb-poll__group--highlighted' : 'sb-poll__option--highlighted', lit);
      }
    }

    get question() { return this.getAttribute('question') ?? ''; }
    set question(text) { this.setAttribute('question', text ?? ''); }

    // The poll as plain text, for a prompt: the question, the options, and each answer once revealed.
    describe() {
      const label = (id) => this._optionById(id)?.label ?? id;
      const lines = [this.question, '', 'Options:', ...this._options.map((o) => `- ${o.label}${this._revealed && o.id === this._outcome ? ' (what happened)' : ''}`)];
      if (!this._revealed) return [...lines, '', `${this._answeredCount()} of ${this._people.length} have answered; answers are hidden until the reveal.`].join('\n');
      lines.push('', 'Answers:');
      for (const person of this._people) {
        const answer = this._answers[person.id];
        if (!answer) { lines.push(`- ${this._who(person)}: no answer`); continue; }
        const mark = this._outcome == null ? '' : answer.option === this._outcome ? ' ✓' : ' ✗';
        lines.push(`- ${this._who(person)}: ${label(answer.option)}${mark}${answer.why ? `\n  Why: "${answer.why}"` : ''}`);
      }
      return lines.join('\n');
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      this._takeSlotted();
      const question = this.question ? `<p class="sb-poll__question" id="${this._id}-question">${esc(this.question)}</p>` : '';
      this.innerHTML = question + (this._revealed ? this._results() : this._asking());
      this._placeSlotted();
      this.highlight = this._highlight;
      this._observer.takeRecords(); // our own changes aren't the sandbox's content arriving
    }

    // Before the reveal: who has answered (never what), a form for whoever hasn't, and Reveal.
    _asking() {
      const waiting = this._people.filter((p) => !this._answers[p.id]);
      if (!waiting.some((p) => p.id === this._draft.person)) this._draft = { person: waiting[0]?.id };
      const people = this._people.map((p) => `
        <span class="sb-poll__person${this._answers[p.id] ? '' : ' sb-poll__person--waiting'}">
          <span data-slot="person:${esc(p.id)}">${this._name(p)}</span>
          <span class="sb-poll__status">${this._answers[p.id] ? 'Answered · hidden' : 'Not answered yet'}</span>
        </span>`).join('');
      const form = waiting.length ? `
        <form class="sb-poll__form">
          <label class="sb-poll__label">I am
            <select name="person">${waiting.map((p) => `<option value="${esc(p.id)}"${p.id === this._draft.person ? ' selected' : ''}>${esc(this._who(p))}</option>`).join('')}</select>
          </label>
          <div class="sb-poll__options" role="group" aria-labelledby="${this._id}-question">${this._options.map((o) => this._option(o)).join('')}</div>
          ${this.hasAttribute('reasons') ? `<label class="sb-poll__label">Why? (optional)<textarea name="why" rows="2">${esc(this._draft.why ?? '')}</textarea></label>` : ''}
          <button type="submit" class="sb-poll__button"${this._draft.option ? '' : ' disabled'}>Submit</button>
        </form>` : '';
      return `
        <div class="sb-poll__people">${people}</div>
        ${form}
        <div class="sb-poll__foot">
          <span>${this._answeredCount()} of ${this._people.length} have answered</span>
          <button type="button" class="sb-poll__button" data-action="reveal"${waiting.length || !this._people.length ? ' disabled' : ''}>Reveal</button>
        </div>`;
    }

    _option(option) {
      const ref = option.ref ? ` data-ref="${esc(option.ref)}" data-option-ref="${esc(option.ref)}"` : '';
      return `<button type="button" class="sb-poll__option" data-option="${esc(option.id)}" aria-pressed="${this._draft.option === option.id}"${ref}>
        <span data-slot="option:${esc(option.id)}"><span class="sb-poll__option-label">${esc(option.label ?? option.id)}</span></span>
      </button>`;
    }

    // After the reveal: every option with who chose it and why, and with an outcome, which held.
    _results() {
      const groups = this._options.map((option) => {
        const chose = this._people.filter((p) => this._answers[p.id]?.option === option.id);
        const held = this._outcome != null && option.id === this._outcome;
        const ref = option.ref ? ` data-ref="${esc(option.ref)}" data-option-ref="${esc(option.ref)}"` : '';
        return `
          <div class="sb-poll__group${held ? ' sb-poll__group--outcome' : ''}" data-option="${esc(option.id)}"${ref}>
            <div class="sb-poll__group-head">
              <span data-slot="option:${esc(option.id)}"><span class="sb-poll__option-label">${esc(option.label ?? option.id)}</span></span>
              <span class="sb-poll__count">${plural(chose.length, 'person', 'people')}</span>
              ${held ? '<span class="sb-poll__held">What happened</span>' : ''}
            </div>
            ${chose.length ? chose.map((p) => this._answer(p, held)).join('') : '<span class="sb-poll__nobody">Nobody chose this.</span>'}
          </div>`;
      }).join('');
      return `${this._summary()}<div class="sb-poll__groups">${groups}</div>`;
    }

    _answer(person, held) {
      const { why } = this._answers[person.id];
      const mark = this._outcome == null ? '' : held
        ? '<span class="sb-poll__mark sb-poll__mark--right" title="Expected what happened">✓</span>'
        : '<span class="sb-poll__mark sb-poll__mark--wrong" title="Expected something else">✗</span>';
      const note = this._notes[person.id];
      return `
        <div class="sb-poll__answer" data-person="${esc(person.id)}">
          <div class="sb-poll__answer-head">${mark}<span data-slot="person:${esc(person.id)}">${this._name(person)}</span></div>
          ${why ? `<p class="sb-poll__why">${esc(why)}</p>` : ''}
          ${note ? `<p class="sb-poll__note">${esc(note)}</p>` : ''}
        </div>`;
    }

    _summary() {
      if (this._outcome == null) return '';
      const right = this._people.filter((p) => this._answers[p.id]?.option === this._outcome).length;
      return `<p class="sb-poll__summary">${right} of ${this._people.length} expected what happened.</p>`;
    }

    _name(person) { return `<span class="sb-poll__name">${esc(person.name ?? person.id)}</span>`; }
    _who(person) { return person.role ? `${person.name ?? person.id}, ${person.role}` : person.name ?? person.id; }
    _optionById(id) { return this._options.find((o) => o.id === id); }
    _answeredCount() { return this._people.filter((p) => this._answers[p.id]).length; }

    // The sandbox's content is kept across redraws, then put back where its slot now is.
    _takeSlotted() {
      for (const el of this.querySelectorAll(':scope > [slot]')) this._slotted.set(el.slot, el);
    }

    _placeSlotted() {
      for (const [name, el] of this._slotted) {
        const place = [...this.querySelectorAll('[data-slot]')].find((at) => at.dataset.slot === name);
        if (place) place.replaceChildren(el);
        else el.remove();
      }
    }

    // ---- Interaction ----

    _onClick(e) {
      const option = e.target.closest('.sb-poll__option');
      if (option) {
        this._draft.option = option.dataset.option;
        for (const el of this.querySelectorAll('.sb-poll__option')) el.setAttribute('aria-pressed', String(el === option));
        this.querySelector('.sb-poll__form [type="submit"]').disabled = false;
        return;
      }
      if (e.target.closest('[data-action="reveal"]')) this.dispatchEvent(new CustomEvent('sb-reveal', { bubbles: true, detail: {} }));
    }

    _onInput(e) {
      if (e.target.name === 'why') this._draft.why = e.target.value;
      if (e.target.name === 'person') this._draft.person = e.target.value;
    }

    // Submitting asks the sandbox to record the answer; the poll shows it once the sandbox sets answers.
    _onSubmit(e) {
      e.preventDefault();
      const { person, option } = this._draft;
      if (!person || !option) return;
      const why = (this._draft.why ?? '').trim();
      this._draft = {};
      this.dispatchEvent(new CustomEvent('sb-answer', { bubbles: true, detail: { person, option, why } }));
    }

    // Pointing at an option with a ref announces it page-wide.
    _point(e) {
      const ref = e.target.closest('[data-option-ref]')?.dataset.optionRef ?? null;
      if (ref === (this._pointing ?? null)) return;
      this._pointing = ref;
      announce(ref);
    }
  }

  customElements.define('sb-poll', SbPoll);
})();
