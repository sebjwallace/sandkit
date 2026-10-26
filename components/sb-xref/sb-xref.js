// Sandkit sb-xref 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// Where a thing appears, and what it's linked to. The sandbox finds the places a ref appears and
// what the model links it to; the cross-reference lists them, grouped, and says which a viewer
// chose to go to or follow. A trail of the things looked at, with Back, means wandering never
// loses anyone.
//
//   xref.subject = { ref: 'RUL-014', title: 'Reorder below the reorder point', kind: 'Rule' };
//   xref.places = [{ view: 'Rules', context: 'RUL-014 · Reorder when stock falls low' }];
//   xref.links = [{ relation: 'rests on', ref: 'CLM-012', title: 'Stores reorder weekly' }];
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-xref';
  const existing = customElements.get('sb-xref');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-xref>, so only one can run. Rename one by replacing every "sb-xref" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-xref { display: block; font-size: 13px; color: var(--sb-text, #1f2933); }
    .sb-xref__trail { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; margin-bottom: 10px; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-xref__back { padding: 2px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: inherit; cursor: pointer; }
    .sb-xref__crumb { padding: 0; border: 0; background: none; color: var(--sb-accent, #2563eb); font: inherit; cursor: pointer; }
    .sb-xref__crumb:hover { text-decoration: underline; }
    .sb-xref__here { color: var(--sb-text, #1f2933); }
    .sb-xref__code { padding: 1px 6px; border-radius: 4px; background: var(--sb-surface-2, #eef0f3); font: 600 12px ui-monospace, Menlo, Consolas, monospace; white-space: nowrap; }
    .sb-xref__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
    .sb-xref__title { font-size: 15px; font-weight: 600; }
    .sb-xref__kind { color: var(--sb-muted, #616e7c); }
    .sb-xref__count { margin: 2px 0 12px; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-xref__section { margin: 12px 0 6px; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .sb-xref__group { margin-bottom: 8px; }
    .sb-xref__group-name { margin-bottom: 3px; font-weight: 600; }
    .sb-xref__list { display: grid; gap: 3px; margin: 0; padding: 0; list-style: none; }
    .sb-xref__place, .sb-xref__link { display: block; width: 100%; padding: 5px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); color: inherit; font: inherit; text-align: left; cursor: pointer; }
    .sb-xref__place:hover, .sb-xref__link:hover { border-color: var(--sb-accent, #2563eb); background: var(--sb-accent-soft, #eaf0ff); }
    .sb-xref__place:focus-visible, .sb-xref__link:focus-visible, .sb-xref__back:focus-visible, .sb-xref__crumb:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-xref__place mark { padding: 0 1px; border-radius: 3px; background: var(--sb-accent-soft, #eaf0ff); color: inherit; font-weight: 600; }
    .sb-xref__state { display: block; margin-top: 2px; color: var(--sb-muted, #616e7c); font-size: 11px; }
    .sb-xref__place--unavailable { border-style: dashed; color: var(--sb-muted, #616e7c); cursor: default; }
    .sb-xref__place--unavailable:hover { border-color: var(--sb-border, #d5d9e0); background: var(--sb-surface, #fff); }
    .sb-xref__link { display: flex; align-items: baseline; gap: 8px; }
    .sb-xref__empty { color: var(--sb-muted, #616e7c); }`;

  // How many earlier subjects the trail shows before the one being looked at.
  const TRAIL_SHOWN = 4;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  // Things in the order they were given, gathered under each key the first time it appears.
  function groupBy(items, key) {
    const groups = new Map();
    items.forEach((item, index) => {
      const name = String(item[key] ?? '');
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push({ item, index });
    });
    return [...groups];
  }

  // The context as text, with each mention of the ref marked.
  const emphasise = (context, ref) => (ref ? esc(context).split(esc(ref)).join(`<mark>${esc(ref)}</mark>`) : esc(context));

  // The page-wide highlight (practices/highlighting.md): { ref } while pointed at, { ref: null } after.
  const announce = (ref) => document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref } }));

  function addStyle() {
    if (document.getElementById('sb-xref-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-xref-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbXref extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['empty-text'];

    constructor() {
      super();
      this._subject = null;
      this._places = [];
      this._links = [];
      this._trail = []; // subjects looked at before this one, oldest first
      this._pointed = null;
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('pointerover', (e) => this._point(e.target));
      this.addEventListener('focusin', (e) => this._point(e.target));
      this.addEventListener('pointerleave', () => this._point(null));
      this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this._point(null); });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-xref');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // { ref, title, kind }: what's being looked at. Setting another puts this one on the trail.
    get subject() { return this._subject; }
    set subject(value) {
      const next = value?.ref == null ? null : { ...value, ref: String(value.ref) };
      if (this._subject && next && next.ref !== this._subject.ref) this._trail.push(this._subject);
      this._subject = next;
      this.render();
    }

    // [{ view, context, hidden, unavailable }]: where the subject appears, in page order.
    get places() { return this._places; }
    set places(list) {
      this._places = list || [];
      this.render();
    }

    // [{ relation, ref, title }]: what the model links the subject to.
    get links() { return this._links; }
    set links(list) {
      this._links = list || [];
      this.render();
    }

    // The subjects looked at before this one, oldest first.
    get trail() { return this._trail.slice(); }

    clearTrail() {
      this._trail = [];
      this.render();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (!this._subject) {
        this.innerHTML = `<div class="sb-xref__empty">${esc(this.getAttribute('empty-text') || 'Choose something to see where it appears.')}</div>`;
        return;
      }
      const { ref, title, kind } = this._subject;
      const counts = [`Appears in ${plural(this._places.length, 'place')}`, this._links.length && plural(this._links.length, 'link')].filter(Boolean).join(' · ');
      this.innerHTML = `
        ${this._trailHtml()}
        <div class="sb-xref__head">
          <span class="sb-xref__code">${esc(ref)}</span>
          ${title ? `<span class="sb-xref__title">${esc(title)}</span>` : ''}
          ${kind ? `<span class="sb-xref__kind">${esc(kind)}</span>` : ''}
        </div>
        <div class="sb-xref__count">${counts}</div>
        <div class="sb-xref__section">Appears in</div>
        ${this._places.length ? this._placesHtml() : '<div class="sb-xref__empty">Not on this page. If you expected it here, it may be spelled two ways.</div>'}
        ${this._links.length ? `<div class="sb-xref__section">Linked to</div>${this._linksHtml()}` : ''}`;
    }

    _trailHtml() {
      if (!this._trail.length) return '';
      const start = Math.max(0, this._trail.length - TRAIL_SHOWN);
      const crumbs = this._trail.slice(start).map((s, i) => `<button type="button" class="sb-xref__crumb" data-trail="${start + i}" title="${esc(s.title ?? s.ref)}">${esc(s.ref)}</button> ›`);
      return `
        <div class="sb-xref__trail">
          <button type="button" class="sb-xref__back" data-trail="${this._trail.length - 1}">‹ Back</button>
          ${start ? '… ›' : ''}${crumbs.join(' ')} <span class="sb-xref__here">${esc(this._subject.ref)}</span>
        </div>`;
    }

    // Grouped by view, so the reach of a ref shows at a glance. Never marked with data-ref: these
    // are ways to a place, not places, or the cross-reference would list itself.
    _placesHtml() {
      return groupBy(this._places, 'view').map(([view, entries]) => `
        <div class="sb-xref__group">
          ${view ? `<div class="sb-xref__group-name">${esc(view)}</div>` : ''}
          <ul class="sb-xref__list">${entries.map(({ item, index }) => `<li>${this._placeHtml(item, index)}</li>`).join('')}</ul>
        </div>`).join('');
    }

    _placeHtml(place, index) {
      const unavailable = place.unavailable != null;
      const state = unavailable ? esc(place.unavailable) : place.hidden ? 'Hidden for now: going there opens it' : '';
      return `
        <button type="button" class="sb-xref__place${unavailable ? ' sb-xref__place--unavailable' : ''}" data-index="${index}"${unavailable ? ' aria-disabled="true"' : ''}>
          ${emphasise(place.context, this._subject.ref)}
          ${state ? `<span class="sb-xref__state">${state}</span>` : ''}
        </button>`;
    }

    _linksHtml() {
      return groupBy(this._links, 'relation').map(([relation, entries]) => `
        <div class="sb-xref__group">
          <div class="sb-xref__group-name">${esc(relation)}</div>
          <ul class="sb-xref__list">${entries.map(({ item, index }) => `
            <li><button type="button" class="sb-xref__link" data-link="${index}">
              <span class="sb-xref__code">${esc(item.ref)}</span><span>${esc(item.title ?? '')}</span>
            </button></li>`).join('')}</ul>
        </div>`).join('');
    }

    // ---- Viewers ----

    // Pointing at a place announces the subject; at a link, the linked ref.
    _point(target) {
      const place = target?.closest?.('.sb-xref__place');
      const link = target?.closest?.('.sb-xref__link');
      const ref = place ? this._subject.ref : link ? String(this._links[link.dataset.link].ref) : null;
      if (ref === this._pointed) return;
      this._pointed = ref;
      announce(ref);
    }

    _click(e) {
      const place = e.target.closest('.sb-xref__place');
      const link = e.target.closest('.sb-xref__link');
      const crumb = e.target.closest('[data-trail]');
      if (place && !place.hasAttribute('aria-disabled')) this._fire('sb-go', { ref: this._subject.ref, index: Number(place.dataset.index) });
      else if (link) this._fire('sb-follow', { ref: String(this._links[link.dataset.link].ref) });
      else if (crumb) this._goBack(Number(crumb.dataset.trail));
    }

    // Back to an earlier subject: everything after it on the trail is dropped.
    _goBack(position) {
      const previous = this._trail[position];
      if (!previous) return;
      this._trail = this._trail.slice(0, position);
      this._subject = previous;
      this.render();
      this._fire('sb-back', { ref: previous.ref });
    }

    _fire(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
    }
  }

  customElements.define('sb-xref', SbXref);
})();
