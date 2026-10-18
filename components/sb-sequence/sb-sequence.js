// Sandkit sb-sequence 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// A sequence diagram: participants side by side, each with a lifeline, and the messages between
// them in the order they happen. Marks the message happening now, so a conversation can be played.
//
//   seq.participants = [{ id: 'you', label: 'You' }, { id: 'shop', label: 'Shop' }];
//   seq.messages = [{ from: 'you', to: 'shop', label: 'Order' }, { from: 'shop', to: 'you', label: 'Receipt', kind: 'reply' }];
//   seq.current = '1';
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-sequence';
  const existing = customElements.get('sb-sequence');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-sequence>, so only one can run. Rename one by replacing every "sb-sequence" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-sequence { display: block; overflow-x: auto; contain: inline-size; } /* takes its container's width, and scrolls within it */
    .sb-sequence__svg { display: block; margin: 0 auto; font-family: inherit; overflow: visible; }
    .sb-sequence__head { fill: var(--sb-surface-2, #eef0f3); stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-sequence__name { font-size: 13px; font-weight: 600; fill: var(--sb-text, #1f2933); }
    .sb-sequence__lifeline { stroke: var(--sb-muted, #616e7c); stroke-width: 1; stroke-dasharray: 4 4; }
    .sb-sequence__participant { cursor: pointer; }
    .sb-sequence__participant--highlighted .sb-sequence__head { fill: var(--sb-accent-soft, #eaf0ff); stroke: var(--sb-accent, #2563eb); stroke-width: 2.5; }
    .sb-sequence__participant--highlighted .sb-sequence__lifeline { stroke: var(--sb-accent, #2563eb); stroke-width: 2; }
    .sb-sequence__message { cursor: pointer; transition: opacity 0.15s; }
    .sb-sequence__line { fill: none; stroke: var(--sb-text, #1f2933); stroke-width: 1.5; }
    .sb-sequence__message--reply .sb-sequence__line { stroke-dasharray: 5 4; }
    .sb-sequence__head-filled { fill: var(--sb-text, #1f2933); }
    .sb-sequence__head-open { fill: none; stroke: var(--sb-text, #1f2933); stroke-width: 1.5; }
    .sb-sequence__hit { fill: none; stroke: transparent; stroke-width: 14; }
    .sb-sequence__label { font-size: 12px; fill: var(--sb-text, #1f2933); }
    .sb-sequence__number { font-weight: 700; fill: var(--sb-muted, #616e7c); }
    .sb-sequence__note-box { fill: var(--sb-surface, #fff); stroke: var(--sb-warn, #d69e2e); stroke-width: 1.5; }
    .sb-sequence__note-text { font-size: 12px; fill: var(--sb-text, #1f2933); }
    .sb-sequence__message--good .sb-sequence__line { stroke: var(--sb-good, #3f9142); }
    .sb-sequence__message--warn .sb-sequence__line { stroke: var(--sb-warn, #d69e2e); }
    .sb-sequence__message--bad .sb-sequence__line { stroke: var(--sb-bad, #c53030); }
    .sb-sequence__message--good .sb-sequence__head-filled { fill: var(--sb-good, #3f9142); }
    .sb-sequence__message--warn .sb-sequence__head-filled { fill: var(--sb-warn, #d69e2e); }
    .sb-sequence__message--bad .sb-sequence__head-filled { fill: var(--sb-bad, #c53030); }
    .sb-sequence__message--good .sb-sequence__head-open { stroke: var(--sb-good, #3f9142); }
    .sb-sequence__message--warn .sb-sequence__head-open { stroke: var(--sb-warn, #d69e2e); }
    .sb-sequence__message--bad .sb-sequence__head-open { stroke: var(--sb-bad, #c53030); }
    .sb-sequence__message--upcoming { opacity: 0.25; }
    .sb-sequence__message--current .sb-sequence__line, .sb-sequence__message--highlighted .sb-sequence__line { stroke: var(--sb-accent, #2563eb); stroke-width: 3; }
    .sb-sequence__message--current .sb-sequence__head-filled, .sb-sequence__message--highlighted .sb-sequence__head-filled { fill: var(--sb-accent, #2563eb); }
    .sb-sequence__message--current .sb-sequence__head-open, .sb-sequence__message--highlighted .sb-sequence__head-open { stroke: var(--sb-accent, #2563eb); stroke-width: 2.5; }
    .sb-sequence__message--current .sb-sequence__label { font-weight: 700; }
    .sb-sequence__message--current .sb-sequence__note-box, .sb-sequence__message--highlighted .sb-sequence__note-box { stroke: var(--sb-accent, #2563eb); stroke-width: 2.5; }`;

  // Sizes, in SVG units (which are pixels, since the diagram is never scaled).
  const HEAD = { height: 34, minWidth: 90, padding: 24, charWidth: 7.5 };
  const LABEL = { charWidth: 6.8, padding: 28 };   // room a message label needs between lifelines
  const MIN_GAP = 110;      // between neighbouring lifelines
  const LINE = { first: 8, height: 13, after: 14 }; // a message's label lines, then its line
  const SELF = { width: 32, height: 18 };           // a message to oneself loops out to the right
  const NOTE = { padding: 8, lineHeight: 15, charWidth: 6.8, margin: 8 };
  const ARROW = { length: 9, half: 4.5 };
  const FIRST_ROW = 16;     // between the heads and the first message
  const TAIL = 16;          // lifelines run on past the last message
  const FRAME_PADDING = 8;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const lines = (text) => String(text ?? '').split('\n');
  const KINDS = ['call', 'reply', 'async', 'note'];

  function addStyle() {
    if (document.getElementById('sb-sequence-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-sequence-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // ---- Layout ----

  const headWidth = (p) => Math.max(HEAD.minWidth, String(p.label ?? p.id).length * HEAD.charWidth + HEAD.padding);
  const labelWidth = (text) => Math.max(...lines(text).map((t) => t.length)) * LABEL.charWidth + LABEL.padding;
  // How far below a message's top its line runs, under its label.
  const lineOffset = (text) => LINE.first + lines(text).length * LINE.height;
  const rowHeight = (item) => (item.kind === 'note' ? noteSize(item.label).height + 2 * NOTE.margin
    : lineOffset(item.label) + LINE.after + (item.from === item.to ? SELF.height : 0));
  const noteSize = (text) => ({
    width: Math.max(...lines(text).map((t) => t.length)) * NOTE.charWidth + 2 * NOTE.padding,
    height: lines(text).length * NOTE.lineHeight + 2 * NOTE.padding - 4
  });

  // The participants each item involves, as column numbers. Items naming someone unknown are left out.
  // `given` says the sandbox named the item, rather than it being known by its position.
  function resolve(items, column) {
    return items.map((item, index) => {
      const id = String(item.id ?? index), given = item.id != null;
      const kind = KINDS.includes(item.kind) ? item.kind : 'call';
      if (kind === 'note') {
        const names = [item.over].flat().map(String);
        const over = names.map((p) => column.get(p));
        return over.length && over.every((c) => c != null) ? { ...item, id, given, kind, columns: [Math.min(...over), Math.max(...over)], involves: names } : null;
      }
      const from = column.get(String(item.from)), to = column.get(String(item.to));
      return from != null && to != null ? { ...item, id, given, kind, from, to, involves: [String(item.from), String(item.to)] } : null;
    }).filter(Boolean);
  }

  // How far apart neighbouring lifelines sit: far enough for their heads, and for every label
  // between them. A label spanning several gaps widens each of them evenly.
  function gaps(participants, items) {
    const widths = participants.map(headWidth);
    const gap = widths.slice(1).map((w, i) => Math.max(MIN_GAP, (widths[i] + w) / 2 + 16));
    const spans = items.map((item) => {
      if (item.kind === 'note') return { from: item.columns[0], to: item.columns[1], need: noteSize(item.label).width - 2 * NOTE.margin };
      if (item.from === item.to) return { from: item.from, to: item.from + 1, need: labelWidth(item.label) + SELF.width };
      return { from: Math.min(item.from, item.to), to: Math.max(item.from, item.to), need: labelWidth(item.label) };
    }).filter((s) => s.to > s.from && s.to <= gap.length);
    for (const span of spans.sort((a, b) => (a.to - a.from) - (b.to - b.from))) {
      const have = gap.slice(span.from, span.to).reduce((a, b) => a + b, 0);
      const extra = (span.need - have) / (span.to - span.from);
      if (extra > 0) for (let i = span.from; i < span.to; i++) gap[i] += extra;
    }
    return gap;
  }

  function layout(participants, messages) {
    const column = new Map(participants.map((p, i) => [String(p.id), i]));
    const items = resolve(messages, column);
    const gap = gaps(participants, items);
    const x = participants.map((_, i) => headWidth(participants[0]) / 2 + gap.slice(0, i).reduce((a, b) => a + b, 0));

    let y = HEAD.height + FIRST_ROW;
    const rows = items.map((item) => {
      const top = y;
      y += rowHeight(item);
      return { ...item, top };
    });
    return { x, rows, bottom: y + TAIL };
  }

  // ---- Drawing ----

  function arrowhead(tip, direction, filled) {
    const base = tip.x - direction * ARROW.length;
    const [a, b] = [`${base},${tip.y - ARROW.half}`, `${base},${tip.y + ARROW.half}`];
    return filled
      ? `<path class="sb-sequence__head-filled" d="M${tip.x},${tip.y} L${a} L${b} z"/>`
      : `<path class="sb-sequence__head-open" d="M${a} L${tip.x},${tip.y} L${b}"/>`;
  }

  // ---- The element ----

  class SbSequence extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['numbered'];

    constructor() {
      super();
      this._participants = [];
      this._messages = [];
      this._order = []; // message ids in the order drawn
      this._involves = new Map(); // each message's id, with the participants it involves
      this._current = null;
      this._highlight = {};
      this._pointedAt = null; // { type, id } of what is under the pointer
      this.addEventListener('click', (e) => this._select(e));
      this.addEventListener('pointerover', (e) => this._pointAt(e.target.closest('.sb-sequence__message, .sb-sequence__participant')));
      this.addEventListener('pointerleave', () => this._pointAt(null));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-sequence');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // [{ id, label }], left to right.
    get participants() { return this._participants; }
    set participants(list) {
      this._participants = list || [];
      this.render();
    }

    // [{ id, from, to, label, kind, tone }] in order, and notes: { kind: 'note', over, label }.
    get messages() { return this._messages; }
    set messages(list) {
      this._messages = list || [];
      this.render();
    }

    // The id of the message happening now. Later messages are faded; null shows them all plainly.
    get current() { return this._current; }
    set current(id) {
      this._current = id == null ? null : String(id);
      this._showState();
    }

    // { participants: [ids], messages: [ids] }: what to point at. A participant lights its
    // messages and notes too, and a message lights its participants.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = value || {};
      this._showState();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      if (!this._participants.length) {
        this.innerHTML = '';
        return;
      }
      const { x, rows, bottom } = layout(this._participants, this._messages);
      this._order = rows.map((row) => row.id);
      this._involves = new Map(rows.map((row) => [row.id, row.involves]));
      let number = 0;
      const drawn = rows.map((row) => (row.kind === 'note' ? this._note(row, x) : this._message(row, x, ++number)));
      const frame = this._frame(x, bottom, rows);
      this.innerHTML = `
        <svg class="sb-sequence__svg" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" width="${frame.width}" role="img" aria-label="Sequence diagram">
          ${this._participants.map((p, i) => this._participant(p, x[i], bottom)).join('')}
          ${drawn.join('')}
        </svg>`;
      this._showState();
    }

    // Wide enough for the heads, notes, and loops on the right; as tall as the lifelines.
    _frame(x, bottom, rows) {
      const left = Math.min(...this._participants.map((p, i) => x[i] - headWidth(p) / 2), ...rows.filter((r) => r.kind === 'note').map((r) => this._noteBox(r, x).x));
      const right = Math.max(
        ...this._participants.map((p, i) => x[i] + headWidth(p) / 2),
        ...rows.filter((r) => r.kind === 'note').map((r) => { const b = this._noteBox(r, x); return b.x + b.width; }),
        ...rows.filter((r) => r.kind !== 'note' && r.from === r.to).map((r) => x[r.from] + SELF.width + labelWidth(r.label))
      );
      return { x: left - FRAME_PADDING, y: -FRAME_PADDING, width: right - left + 2 * FRAME_PADDING, height: bottom + 2 * FRAME_PADDING };
    }

    _participant(p, x, bottom) {
      const width = headWidth(p);
      return `
        <g class="sb-sequence__participant" data-ref="${esc(p.id)}">
          <line class="sb-sequence__lifeline" x1="${x}" y1="${HEAD.height}" x2="${x}" y2="${bottom}"/>
          <rect class="sb-sequence__head" x="${x - width / 2}" y="0" width="${width}" height="${HEAD.height}" rx="6"/>
          <text class="sb-sequence__name" x="${x}" y="${HEAD.height / 2 + 4.5}" text-anchor="middle">${esc(p.label ?? p.id)}</text>
        </g>`;
    }

    // A label above its line: between the lifelines, or beside a loop to oneself.
    _message(row, x, number) {
      const tone = row.tone ? ` sb-sequence__message--${esc(row.tone)}` : '';
      const text = lines(row.label);
      const numbered = this.hasAttribute('numbered');
      const self = row.from === row.to;
      const from = x[row.from], to = x[row.to];
      const lineY = row.top + lineOffset(row.label);
      let path, tip, direction, labelAt, anchor;
      if (self) {
        const bottom = lineY + SELF.height;
        path = `M${from},${lineY} H${from + SELF.width} V${bottom} H${from}`;
        [tip, direction] = [{ x: from, y: bottom }, -1];
        [labelAt, anchor] = [{ x: from + SELF.width + 6, y: lineY + SELF.height / 2 - (text.length - 1) * LINE.height / 2 + 4 }, 'start'];
      } else {
        path = `M${from},${lineY} H${to}`;
        [tip, direction] = [{ x: to, y: lineY }, Math.sign(to - from)];
        [labelAt, anchor] = [{ x: (from + to) / 2, y: row.top + LINE.first + LINE.height - 4 }, 'middle'];
      }
      const spans = text.map((t, i) => `<tspan x="${labelAt.x}" y="${labelAt.y + i * LINE.height}">${i === 0 && numbered ? `<tspan class="sb-sequence__number">${number}. </tspan>` : ''}${esc(t)}</tspan>`).join('');
      return `
        <g class="sb-sequence__message sb-sequence__message--${row.kind}${tone}" data-message-id="${esc(row.id)}"${row.given ? ` data-ref="${esc(row.id)}"` : ''}>
          <path class="sb-sequence__hit" d="${path}"/>
          <path class="sb-sequence__line" d="${path}"/>
          ${arrowhead(tip, direction, row.kind === 'call')}
          <text class="sb-sequence__label" text-anchor="${anchor}">${spans}</text>
        </g>`;
    }

    // A note sits over the lifelines it names, a little wider than them.
    _noteBox(row, x) {
      const size = noteSize(row.label);
      const [left, right] = [x[row.columns[0]], x[row.columns[1]]];
      const width = Math.max(size.width, right - left + 2 * NOTE.margin + 2 * NOTE.padding);
      return { x: (left + right) / 2 - width / 2, y: row.top + NOTE.margin, width, height: size.height };
    }

    _note(row, x) {
      const box = this._noteBox(row, x);
      const spans = lines(row.label).map((t, i) => `<tspan x="${box.x + NOTE.padding}" y="${box.y + NOTE.padding + 9 + i * NOTE.lineHeight}">${esc(t)}</tspan>`).join('');
      return `
        <g class="sb-sequence__message sb-sequence__message--note" data-message-id="${esc(row.id)}"${row.given ? ` data-ref="${esc(row.id)}"` : ''}>
          <rect class="sb-sequence__note-box" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="3"/>
          <text class="sb-sequence__note-text">${spans}</text>
        </g>`;
    }

    // Marks the current message, fades the ones still to come, and lights what is highlighted or
    // pointed at, with what it's connected to: a participant's messages, a message's participants.
    _showState() {
      const at = this._order.indexOf(this._current);
      const chosen = (key, type) => new Set([...(this._highlight[key] ?? []).map(String), ...(this._pointedAt?.type === type ? [this._pointedAt.id] : [])]);
      const participants = chosen('participants', 'participant'), messages = chosen('messages', 'message');
      const litParticipants = new Set(participants), litMessages = new Set(messages);
      for (const [id, involves] of this._involves) {
        if (involves.some((p) => participants.has(p))) litMessages.add(id);
        if (messages.has(id)) involves.forEach((p) => litParticipants.add(p));
      }
      for (const el of this.querySelectorAll('.sb-sequence__message')) {
        const index = this._order.indexOf(el.dataset.messageId);
        el.classList.toggle('sb-sequence__message--current', at >= 0 && index === at);
        el.classList.toggle('sb-sequence__message--upcoming', at >= 0 && index > at);
        el.classList.toggle('sb-sequence__message--highlighted', litMessages.has(el.dataset.messageId));
      }
      for (const el of this.querySelectorAll('.sb-sequence__participant')) {
        el.classList.toggle('sb-sequence__participant--highlighted', litParticipants.has(el.dataset.ref));
      }
    }

    // ---- Interaction ----

    _pointAt(el) {
      const pointed = !el ? null : el.dataset.messageId != null ? { type: 'message', id: el.dataset.messageId } : { type: 'participant', id: el.dataset.ref };
      if (pointed?.type === this._pointedAt?.type && pointed?.id === this._pointedAt?.id) return;
      this._pointedAt = pointed;
      this._showState();
    }

    _select(e) {
      const message = e.target.closest('[data-message-id]');
      const participant = e.target.closest('.sb-sequence__participant');
      if (message) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { type: 'message', id: message.dataset.messageId } }));
      else if (participant) this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { type: 'participant', id: participant.dataset.ref } }));
    }
  }

  customElements.define('sb-sequence', SbSequence);
})();
