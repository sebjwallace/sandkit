// Sandkit sb-erd 0.1.2 · MIT Licence · https://github.com/sebjwallace/sandkit
// An entity relationship diagram whose lines start at the very field that holds the reference
// and end at the very field it refers to, so every line says exactly which field points where.
//
//   erd.entities = [
//     { id: 'customers', name: 'Customer', x: 0, y: 0, fields: [{ name: 'id', type: 'int', key: 'primary' }] },
//     { id: 'orders', name: 'Order', x: 260, y: 0, fields: [{ name: 'customer_id', type: 'int', references: 'customers.id' }] }
//   ];
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-erd';
  const existing = customElements.get('sb-erd');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-erd>, so only one can run. Rename one by replacing every "sb-erd" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-erd { display: block; }
    .sb-erd__svg { display: block; max-width: 100%; height: auto; margin: 0 auto; font-family: inherit; overflow: visible; }
    .sb-erd__fill { fill: var(--sb-surface, #fff); }
    .sb-erd__head { fill: var(--sb-surface-2, #eef0f3); }
    .sb-erd__outline { fill: none; stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-erd__name { font-size: 13px; font-weight: 600; fill: var(--sb-text, #1f2933); }
    .sb-erd__entity { cursor: default; }
    .sb-erd__entity--good .sb-erd__outline { stroke: var(--sb-good, #3f9142); stroke-width: 2.5; }
    .sb-erd__entity--warn .sb-erd__outline { stroke: var(--sb-warn, #d69e2e); stroke-width: 2.5; }
    .sb-erd__entity--bad .sb-erd__outline { stroke: var(--sb-bad, #c53030); stroke-width: 2.5; }
    .sb-erd__entity--highlighted .sb-erd__outline { stroke: var(--sb-accent, #2563eb); stroke-width: 3; }
    .sb-erd__field { cursor: pointer; }
    .sb-erd__row { fill: transparent; }
    .sb-erd__field--highlighted .sb-erd__row { fill: var(--sb-accent-soft, #eaf0ff); }
    .sb-erd__key { font-size: 9px; font-weight: 700; letter-spacing: 0.04em; fill: var(--sb-muted, #616e7c); }
    .sb-erd__field-name { font: 12px ui-monospace, Menlo, Consolas, monospace; fill: var(--sb-text, #1f2933); }
    .sb-erd__field--primary .sb-erd__field-name { font-weight: 700; }
    .sb-erd__type { font: 11px ui-monospace, Menlo, Consolas, monospace; fill: var(--sb-muted, #616e7c); }
    .sb-erd__field--highlighted .sb-erd__field-name, .sb-erd__field--highlighted .sb-erd__key { fill: var(--sb-accent, #2563eb); }
    .sb-erd__link { cursor: pointer; }
    .sb-erd__line { fill: none; stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-erd__end { fill: var(--sb-muted, #616e7c); }
    .sb-erd__hit { fill: none; stroke: transparent; stroke-width: 12; }
    .sb-erd__link--highlighted .sb-erd__line { stroke: var(--sb-accent, #2563eb); stroke-width: 2.5; }
    .sb-erd__link--highlighted .sb-erd__end { fill: var(--sb-accent, #2563eb); }`;

  // Sizes, in SVG units (which are pixels, since the diagram is never scaled up). Rows have a fixed
  // height, so every field's vertical position is known exactly, without measuring the page.
  const SIZE = { header: 30, row: 24, minWidth: 150, padding: 10, key: 28, gap: 20, nameChar: 7.3, typeChar: 6.7, titleChar: 8 };
  const REACH = 40;         // how far a line leaves its box before turning
  const ARROW = { length: 9, half: 4.5 };
  const DOT = 3;            // the dot marking where a line starts
  const LAYOUT_GAP = 80;    // between entities placed automatically
  const FRAME_PADDING = 16;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-erd-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-erd-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // ---- Geometry ----

  // 'orders.customer_id' → ['orders', 'customer_id']; 'orders' → ['orders', undefined].
  function splitRef(ref) {
    const dot = String(ref).indexOf('.');
    return dot < 0 ? [String(ref), undefined] : [ref.slice(0, dot), ref.slice(dot + 1)];
  }

  // Entities without positions are placed side by side.
  function layout(entities) {
    if (entities.every((e) => e.x != null && e.y != null)) return entities;
    let x = 0;
    return entities.map((e) => {
      const placed = { ...e, x, y: 0 };
      x += e.width + LAYOUT_GAP;
      return placed;
    });
  }

  // An entity's size, from its title and its widest field. Text widths are estimated.
  function measure(entity) {
    const fields = entity.fields || [];
    const title = String(entity.name ?? entity.id).length * SIZE.titleChar + 2 * SIZE.padding;
    const row = (f) => SIZE.key + String(f.name).length * SIZE.nameChar + SIZE.gap + String(f.type ?? '').length * SIZE.typeChar + SIZE.padding;
    const width = Math.max(SIZE.minWidth, title, ...fields.map(row));
    return { ...entity, fields, width, height: SIZE.header + fields.length * SIZE.row };
  }

  // The vertical middle of a field's row, or of the title when the field isn't named or found.
  function anchorY(entity, fieldName) {
    const index = entity.fields.findIndex((f) => f.name === fieldName);
    return entity.y + (index < 0 ? SIZE.header / 2 : SIZE.header + index * SIZE.row + SIZE.row / 2);
  }

  // A line leaves the side of its row that faces the target and enters the target's facing side.
  // When the boxes overlap side to side, or it's the same box, it leaves and enters on the right,
  // bowing out past both.
  function route(source, sourceY, target, targetY) {
    const sides = target.x >= source.x + source.width ? [1, -1]
      : target.x + target.width <= source.x ? [-1, 1]
      : [1, 1];
    const [out, into] = sides; // +1 is the right side, -1 the left
    const start = { x: out > 0 ? source.x + source.width : source.x, y: sourceY };
    const end = { x: into > 0 ? target.x + target.width : target.x, y: targetY };
    let c1, c2;
    if (out === into) {
      const x = Math.max(start.x, end.x) + REACH;
      c1 = { x, y: start.y };
      c2 = { x, y: end.y };
    } else {
      const reach = Math.max(REACH, Math.abs(end.x - start.x) / 2);
      c1 = { x: start.x + out * reach, y: start.y };
      c2 = { x: end.x + into * reach, y: end.y };
    }
    // The arrow points into the target, so its base lies on the outside.
    const base = end.x + into * ARROW.length;
    return {
      start, end, points: [start, c1, c2, end],
      d: `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`,
      arrow: `M${end.x},${end.y} L${base},${end.y - ARROW.half} L${base},${end.y + ARROW.half} z`
    };
  }

  // One link per field with a reference to an entity that exists.
  function linksBetween(entities) {
    const byId = Object.fromEntries(entities.map((e) => [e.id, e]));
    return entities.flatMap((entity) => entity.fields.filter((f) => f.references != null).map((field) => {
      const [targetId, targetField] = splitRef(field.references);
      const target = byId[targetId];
      if (!target) return null;
      const found = target.fields.some((f) => f.name === targetField);
      return {
        source: `${entity.id}.${field.name}`,
        target: found ? `${targetId}.${targetField}` : null,
        targetEntity: targetId,
        ...route(entity, anchorY(entity, field.name), target, anchorY(target, found ? targetField : undefined))
      };
    })).filter(Boolean);
  }

  // ---- The element ----

  class SbErd extends HTMLElement {
    static origin = ORIGIN;

    constructor() {
      super();
      this._entities = [];
      this._links = [];
      this._highlight = {};
      this._pointedAt = null; // the field or link under the pointer
      this.addEventListener('pointerover', (e) => this._pointAt(e.target.closest('[data-field]')?.dataset.field ?? null));
      this.addEventListener('pointerleave', () => this._pointAt(null));
      this.addEventListener('click', (e) => this._select(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-erd');
      this.render();
    }

    // ---- Public API ----

    // [{ id, name, x, y, tone, fields: [{ name, type, key, references }] }]
    get entities() { return this._entities; }
    set entities(list) {
      this._entities = list || [];
      this.render();
    }

    // { entities: [id, …], fields: ['entity.field', …] }: what to point at. A field lights its
    // relationships too, and what is at their other ends.
    get highlight() { return this._highlight; }
    set highlight(value) {
      this._highlight = value || {};
      this._showHighlight();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      const entities = layout(this._entities.map(measure));
      if (!entities.length) {
        this.innerHTML = '';
        return;
      }
      this._links = linksBetween(entities);
      const frame = this._frame(entities, this._links);
      this.innerHTML = `
        <svg class="sb-erd__svg" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" width="${frame.width}" role="img" aria-label="Entity relationship diagram">
          ${entities.map((e) => this._entity(e)).join('')}
          ${this._links.map((link) => this._link(link)).join('')}
        </svg>`;
      this._showHighlight();
    }

    // Frames every box and line snugly; a curve never strays beyond its control points.
    _frame(entities, links) {
      const points = entities.flatMap((e) => [{ x: e.x, y: e.y }, { x: e.x + e.width, y: e.y + e.height }])
        .concat(links.flatMap((link) => link.points));
      const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
      const x = Math.min(...xs) - FRAME_PADDING, y = Math.min(...ys) - FRAME_PADDING;
      return { x, y, width: Math.max(...xs) - x + FRAME_PADDING, height: Math.max(...ys) - y + FRAME_PADDING };
    }

    _entity(entity) {
      const { width, height } = entity, r = 6;
      const tone = entity.tone ? ` sb-erd__entity--${esc(entity.tone)}` : '';
      return `
        <g class="sb-erd__entity${tone}" data-ref="${esc(entity.id)}" transform="translate(${entity.x}, ${entity.y})">
          <rect class="sb-erd__fill" width="${width}" height="${height}" rx="${r}"/>
          <path class="sb-erd__head" d="M0,${SIZE.header} V${r} Q0,0 ${r},0 H${width - r} Q${width},0 ${width},${r} V${SIZE.header} z"/>
          <text class="sb-erd__name" x="${SIZE.padding}" y="${SIZE.header / 2 + 4.5}">${esc(entity.name ?? entity.id)}</text>
          ${entity.fields.map((f, i) => this._field(entity, f, i)).join('')}
          <rect class="sb-erd__outline" width="${width}" height="${height}" rx="${r}"/>
        </g>`;
    }

    _field(entity, field, index) {
      const top = SIZE.header + index * SIZE.row, middle = top + SIZE.row / 2 + 4;
      const key = field.key === 'primary' ? 'PK' : field.references != null ? 'FK' : '';
      const primary = field.key === 'primary' ? ' sb-erd__field--primary' : '';
      const title = field.references != null ? `${field.name} → ${field.references}` : field.name;
      return `
        <g class="sb-erd__field${primary}" data-field="${esc(`${entity.id}.${field.name}`)}" data-ref="${esc(`${entity.id}.${field.name}`)}">
          <title>${esc(title)}</title>
          <rect class="sb-erd__row" y="${top}" width="${entity.width}" height="${SIZE.row}"/>
          <text class="sb-erd__key" x="${SIZE.padding}" y="${middle - 1}">${key}</text>
          <text class="sb-erd__field-name" x="${SIZE.key}" y="${middle}">${esc(field.name)}</text>
          <text class="sb-erd__type" x="${entity.width - SIZE.padding}" y="${middle}" text-anchor="end">${esc(field.type ?? '')}</text>
        </g>`;
    }

    _link(link) {
      return `
        <g class="sb-erd__link" data-field="${esc(link.source)}">
          <title>${esc(`${link.source} → ${link.target ?? link.targetEntity}`)}</title>
          <path class="sb-erd__hit" d="${link.d}"/>
          <path class="sb-erd__line" d="${link.d}"/>
          <circle class="sb-erd__end" cx="${link.start.x}" cy="${link.start.y}" r="${DOT}"/>
          <path class="sb-erd__end" d="${link.arrow}"/>
        </g>`;
    }

    // Lights what is highlighted or pointed at. A field lights every link it is an end of, and the
    // other end too, so pointing either way shows the whole relationship.
    _showHighlight() {
      const chosen = new Set(this._highlight.fields ?? []);
      if (this._pointedAt) chosen.add(this._pointedAt);
      const fields = new Set(chosen), entities = new Set(this._highlight.entities ?? []), links = new Set();
      for (const link of this._links) {
        if (!chosen.has(link.source) && !(link.target && chosen.has(link.target))) continue;
        links.add(link.source);
        fields.add(link.source);
        if (link.target) fields.add(link.target);
        else entities.add(link.targetEntity);
      }
      for (const el of this.querySelectorAll('.sb-erd__field')) el.classList.toggle('sb-erd__field--highlighted', fields.has(el.dataset.field));
      for (const el of this.querySelectorAll('.sb-erd__link')) el.classList.toggle('sb-erd__link--highlighted', links.has(el.dataset.field));
      for (const el of this.querySelectorAll('.sb-erd__entity')) el.classList.toggle('sb-erd__entity--highlighted', entities.has(el.dataset.ref));
    }

    // ---- Interaction ----

    _pointAt(field) {
      if (field === this._pointedAt) return;
      this._pointedAt = field;
      this._showHighlight();
    }

    _select(e) {
      const part = e.target.closest('[data-field], .sb-erd__entity');
      if (!part) return;
      const [entity, field] = part.dataset.field ? splitRef(part.dataset.field) : [part.dataset.ref, undefined];
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { entity, field: field ?? null } }));
    }
  }

  customElements.define('sb-erd', SbErd);
})();
