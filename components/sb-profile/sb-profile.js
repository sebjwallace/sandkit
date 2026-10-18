// Sandkit sb-profile 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// The shape and value domain of a set of same-shaped records: every field across all samples,
// its types, how often it's there and the values it takes, with what's surprising found first.
//
//   <sb-profile></sb-profile>
//   prof.samples = orders;
//   prof.options = { id: 'orderId' };
//   customElements.get('sb-profile').profile(orders)   // the same answer, drawing nothing
//
// The core comes first and runs anywhere; tools/analyse.mjs runs it from Node.
// See manifest.md for the full contract.
(function () {
  // ---- Core: plain functions, no DOM. Also used by tools/analyse.mjs. ----

  const LIMIT = 20;
  const BINS = 10;
  const MAX_SAMPLE_REFS = 5;
  // Fewer occurrences than this, and every field looks constant or unique by chance.
  const MIN_EVIDENCE = 5;
  // A value seen once is rare only when the others are each seen this many times on average.
  const RARE_RATIO = 5;
  const TYPE_ORDER = ['null', 'boolean', 'number', 'string', 'array', 'object'];

  function profile(samples, options = {}) {
    const { limit = LIMIT, id, path } = options;
    const records = path ? select(samples, path) : samples;
    const fields = new Map();

    records.forEach((record, index) => {
      if (typeOf(record) !== 'object') throw new Error(`profile expects objects, but sample #${index} is ${typeOf(record)}`);
      const ref = (id && valueAt(record, id) !== undefined) ? valueAt(record, id) : `#${index}`;
      walkObject(fields, record, '', index, ref);
    });

    const ordered = inPathOrder(fields);
    return {
      count: records.length,
      findings: findingsOf(ordered, fields, records.length, limit),
      fields: ordered.map((field) => describe(field, limit)),
    };
  }

  // Each sample's records at a dotted path; an array there gives one record per element.
  function select(samples, path) {
    return samples.flatMap((sample) => {
      const value = valueAt(sample, path);
      return value === undefined ? [] : Array.isArray(value) ? value : [value];
    });
  }

  function valueAt(value, path) {
    return path.split('.').reduce((at, key) => (at !== null && typeof at === 'object' ? at[key] : undefined), value);
  }

  function typeOf(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  const isPrimitive = (type) => type !== 'array' && type !== 'object';

  // ---- Gathering: one pass over every value, recorded under its path. ----

  function walkObject(fields, object, path, sample, ref) {
    for (const [key, value] of Object.entries(object)) {
      record(fields, path ? `${path}.${key}` : key, path, value, sample, ref);
    }
  }

  function record(fields, path, parent, value, sample, ref) {
    const field = fieldAt(fields, path, parent);
    const type = typeOf(value);
    field.seen++;
    if (field.lastSample !== sample) { field.present++; field.lastSample = sample; }
    field.types[type] = (field.types[type] || 0) + 1;
    noteRef(field, type, ref);

    if (isPrimitive(type)) countValue(field, value);
    if (type === 'number') field.numbers.push(value);
    if (type === 'object') { field.objects++; walkObject(fields, value, path, sample, ref); }
    if (type === 'array') {
      field.lengths.push(value.length);
      value.forEach((element) => record(fields, `${path}[]`, path, element, sample, ref));
    }
  }

  function fieldAt(fields, path, parent) {
    if (!fields.has(path)) {
      fields.set(path, { path, parent, seen: 0, present: 0, lastSample: -1, objects: 0, types: {}, refs: {}, values: new Map(), numbers: [], lengths: [] });
    }
    return fields.get(path);
  }

  // A few samples holding each type, so a finding can say which samples are the odd ones out.
  function noteRef(field, type, ref) {
    const refs = field.refs[type] || (field.refs[type] = []);
    if (refs.length < MAX_SAMPLE_REFS && !refs.includes(ref)) refs.push(ref);
  }

  function countValue(field, value) {
    const key = JSON.stringify(value);
    const entry = field.values.get(key);
    if (entry) entry.count++;
    else field.values.set(key, { value, count: 1 });
  }

  // Parents before children, each level in the order its fields were first seen.
  function inPathOrder(fields) {
    const children = new Map();
    for (const field of fields.values()) {
      if (!children.has(field.parent)) children.set(field.parent, []);
      children.get(field.parent).push(field);
    }
    const below = (path) => (children.get(path) || []).flatMap((field) => [field, ...below(field.path)]);
    return below('');
  }

  // ---- Describing: each field as plain JSON. ----

  function describe(field, limit) {
    const values = sortedValues(field);
    const result = {
      path: field.path,
      present: field.present,
      types: sortedTypes(field.types),
      distinct: values.length,
      values: values.slice(0, limit),
      more: Math.max(0, values.length - limit),
    };
    if (field.numbers.length) result.numbers = summarise(field.numbers);
    if (field.lengths.length) result.lengths = summarise(field.lengths);
    return result;
  }

  function sortedTypes(types) {
    return Object.fromEntries(TYPE_ORDER.filter((type) => types[type]).map((type) => [type, types[type]]));
  }

  // Most common first; ties by value, so the same samples always give the same order.
  function sortedValues(field) {
    return [...field.values.values()].sort((a, b) => b.count - a.count || compareValues(a.value, b.value));
  }

  function compareValues(a, b) {
    const byType = TYPE_ORDER.indexOf(typeOf(a)) - TYPE_ORDER.indexOf(typeOf(b));
    if (byType) return byType;
    return a < b ? -1 : a > b ? 1 : 0;
  }

  function summarise(numbers) {
    let min = Infinity, max = -Infinity, sum = 0;
    for (const n of numbers) { min = Math.min(min, n); max = Math.max(max, n); sum += n; }
    return { min, max, mean: tidy(sum / numbers.length), histogram: histogram(numbers, min, max) };
  }

  // About ten bins of a round width (1, 2 or 5 times a power of ten), starting on a multiple of it.
  function histogram(numbers, min, max) {
    if (min === max) return [{ from: min, to: max, count: numbers.length }];
    // Whole numbers never get bins narrower than one, which would leave every other bin empty.
    const step = Math.max(roundStep((max - min) / BINS), numbers.every(Number.isInteger) ? 1 : 0);
    const start = Math.floor(min / step) * step;
    const binOf = (n) => Math.floor((n - start) / step);
    const bins = Array.from({ length: binOf(max) + 1 }, (_, i) => ({ from: tidy(start + i * step), to: tidy(start + (i + 1) * step), count: 0 }));
    for (const n of numbers) bins[binOf(n)].count++;
    return bins;
  }

  function roundStep(rough) {
    const power = 10 ** Math.floor(Math.log10(rough));
    return [1, 2, 5, 10].map((m) => m * power).find((step) => step >= rough);
  }

  // Clears floating-point dust such as 0.30000000000000004.
  const tidy = (n) => Number(n.toPrecision(12));

  // ---- Findings: what's worth a person's attention, by kind, then in path order. ----

  function findingsOf(ordered, fields, count, limit) {
    // How often a field could have been there: once per sample at the top, else once per parent object.
    const chances = (field) => (field.parent ? fields.get(field.parent).objects : count);
    const kinds = [
      (field) => constant(field),
      (field) => unique(field),
      (field) => sometimesMissing(field, chances(field)),
      (field) => mixedTypes(field),
      (field) => rareValues(field, limit),
    ];
    return kinds.flatMap((kind) => ordered.map(kind).filter(Boolean));
  }

  // Only fields holding nothing but plain values can be constant or unique.
  const onlyPlainValues = (field) => Object.keys(field.types).every(isPrimitive);

  function constant(field) {
    if (field.seen < MIN_EVIDENCE || !onlyPlainValues(field) || field.values.size !== 1) return null;
    return { kind: 'constant', path: field.path, value: [...field.values.values()][0].value };
  }

  function unique(field) {
    if (field.seen < MIN_EVIDENCE || !onlyPlainValues(field) || field.values.size !== field.seen) return null;
    return { kind: 'unique', path: field.path };
  }

  // Counted against the parent, so a missing parent isn't reported again for every field inside
  // it. An array's elements are never missing: an empty array is a length of 0.
  function sometimesMissing(field, chances) {
    if (field.path.endsWith('[]') || field.seen >= chances) return null;
    return { kind: 'sometimes-missing', path: field.path, present: field.seen, of: chances };
  }

  function mixedTypes(field) {
    const types = sortedTypes(field.types);
    const names = Object.keys(types);
    if (names.length < 2) return null;
    const usual = names.reduce((a, b) => (types[b] > types[a] ? b : a));
    const odd = names.filter((type) => type !== usual).flatMap((type) => field.refs[type]);
    return { kind: 'mixed-types', path: field.path, types, samples: [...new Set(odd)].slice(0, MAX_SAMPLE_REFS) };
  }

  function rareValues(field, limit) {
    const plain = [...field.values.values()];
    const occurrences = plain.reduce((sum, entry) => sum + entry.count, 0);
    if (plain.length < 2 || plain.length > limit || occurrences < plain.length * RARE_RATIO) return null;
    const once = plain.filter((entry) => entry.count === 1).map((entry) => entry.value).sort(compareValues);
    return once.length ? { kind: 'rare-values', path: field.path, values: once } : null;
  }

  // ---- Words: findings as the element and tools/analyse.mjs --md both say them. ----

  const shown = (value) => (typeof value === 'string' ? value : JSON.stringify(value));
  // A mean short enough to read at a glance.
  const brief = (n) => (Math.abs(n) >= 1000 ? Math.round(n) : Number(n.toPrecision(4)));
  const PLURALS = { null: 'null', boolean: 'booleans', number: 'numbers', string: 'strings', array: 'arrays', object: 'objects' };
  const SINGULARS = { null: 'null', boolean: 'a boolean', number: 'a number', string: 'a string', array: 'an array', object: 'an object' };

  function percent(part, whole) {
    const p = Math.round((part / whole) * 100);
    if (p === 0 && part > 0) return 'under 1%';
    if (p === 100 && part < whole) return 'over 99%';
    return `${p}%`;
  }

  function phrase(finding) {
    switch (finding.kind) {
      case 'constant': return `always ${shown(finding.value)}`;
      case 'unique': return 'every value different';
      case 'sometimes-missing': return `missing in ${percent(finding.of - finding.present, finding.of)}`;
      case 'mixed-types': {
        const counts = Object.entries(finding.types);
        const usual = counts.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
        return counts.filter(([type]) => type !== usual)
          .map(([type, n]) => (n === 1 ? `1 is ${SINGULARS[type]}` : `${n} are ${PLURALS[type]}`)).join(', ');
      }
      case 'rare-values': return `seen once: ${finding.values.map(shown).join(', ')}`;
    }
  }

  // A short readable summary: findings first, then a line per field.
  function markdown(result) {
    const cell = (text) => String(text).replace(/\|/g, '\\|').replace(/\s+/g, ' ');
    const types = (field) => Object.entries(field.types).map(([type, n]) => (Object.keys(field.types).length > 1 ? `${type} ${n}` : type)).join(', ');
    const range = ({ min, max, mean }) => `${min} to ${max}, mean ${brief(mean)}`;
    const about = (field) => [
      field.lengths && `lengths ${range(field.lengths)}`,
      field.numbers && range(field.numbers),
      !field.numbers && field.values.length && field.values.slice(0, 3).map((v) => `${shown(v.value)} (${v.count})`).join(', ') + (field.distinct > 3 ? ', …' : ''),
    ].filter(Boolean).join('; ');

    return [
      `# Profile of ${result.count} samples`, '',
      '## Findings', '',
      ...(result.findings.length ? result.findings.map((f) => `- \`${f.path}\`: ${phrase(f)}${f.samples ? ` (${f.samples.map(shown).join(', ')})` : ''}`) : ['Nothing stands out.']),
      '', '## Fields', '',
      '| Field | Types | Present | Distinct | Values |',
      '|---|---|---|---|---|',
      ...result.fields.map((f) => `| \`${cell(f.path)}\` | ${types(f)} | ${percent(f.present, result.count)} | ${f.distinct} | ${cell(about(f))} |`),
      '',
    ].join('\n');
  }

  profile.markdown = markdown;
  const core = { profile };

  // ---- Node: hand the core to tools. ----
  if (typeof module !== 'undefined' && module.exports) module.exports = core;

  // ---- Browser: the element. ----
  if (typeof customElements === 'undefined') return;

  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-profile';
  const existing = customElements.get('sb-profile');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-profile>, so only one can run. Rename one by replacing every "sb-profile" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-profile { display: block; font-size: 13px; }
    .sb-profile__summary { margin-bottom: 6px; color: var(--sb-muted, #616e7c); }
    .sb-profile__tally { margin-left: 4px; }
    .sb-profile__kind { margin: 0 -2px; padding: 0 2px; border-radius: 4px; }
    .sb-profile__kind:hover, .sb-profile__kind--highlighted { color: var(--sb-text, #1f2933); background: var(--sb-accent-soft, #eaf0ff); }
    .sb-profile__table { display: grid; grid-template-columns: minmax(120px, max-content) max-content minmax(90px, 140px) max-content minmax(0, 1fr); overflow: auto; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); }
    .sb-profile__head, .sb-profile__field { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; align-items: center; }
    .sb-profile__head > *, .sb-profile__field > * { padding: 4px 10px; min-width: 0; }
    .sb-profile__head { position: sticky; top: 0; z-index: 1; background: var(--sb-surface-2, #eef0f3); color: var(--sb-muted, #616e7c); font-weight: 600; border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-profile__field { border-bottom: 1px solid var(--sb-surface-2, #eef0f3); }
    .sb-profile__field:last-child { border-bottom: 0; }
    .sb-profile__field:hover { background: color-mix(in srgb, var(--sb-accent, #2563eb) 5%, transparent); }
    .sb-profile__field--highlighted, .sb-profile__field--highlighted:hover { background: var(--sb-accent-soft, #eaf0ff); box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }
    /* A highlighted value the row isn't showing: the row is marked, so pointing never disappears. */
    .sb-profile__field--holds-highlight { box-shadow: inset 3px 0 0 var(--sb-accent, #2563eb); }
    .sb-profile__name { all: unset; box-sizing: border-box; cursor: pointer; white-space: nowrap; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }
    .sb-profile__name::before { content: '▸ '; color: var(--sb-muted, #616e7c); }
    .sb-profile__name[aria-expanded="true"]::before { content: '▾ '; }
    .sb-profile__field--gone { color: var(--sb-muted, #616e7c); }
    .sb-profile__field--gone .sb-profile__name { cursor: default; text-decoration: line-through; }
    .sb-profile__field--gone .sb-profile__name::before { visibility: hidden; }
    .sb-profile__name:focus-visible, .sb-profile__value:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    .sb-profile__types { color: var(--sb-muted, #616e7c); white-space: nowrap; }
    .sb-profile__present { display: flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .sb-profile__meter { flex: 1 1 auto; height: 6px; min-width: 30px; border-radius: 3px; background: var(--sb-surface-2, #eef0f3); overflow: hidden; }
    .sb-profile__meter > span { display: block; height: 100%; background: var(--sb-accent, #2563eb); }
    .sb-profile__distinct { text-align: right; font-variant-numeric: tabular-nums; }
    .sb-profile__changed { background: color-mix(in srgb, var(--sb-warn, #d69e2e) 20%, transparent); }
    .sb-profile__was { color: var(--sb-muted, #616e7c); font-size: 11px; }
    .sb-profile__findings { display: flex; flex-wrap: wrap; gap: 4px; }
    .sb-profile__finding { max-width: 100%; padding: 0 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-radius: 4px; font-size: 12px; background: var(--sb-accent-soft, #eaf0ff); color: var(--sb-text, #1f2933); }
    .sb-profile__finding[data-kind="sometimes-missing"], .sb-profile__finding[data-kind="mixed-types"], .sb-profile__finding[data-kind="rare-values"] { background: color-mix(in srgb, var(--sb-warn, #d69e2e) 22%, transparent); }
    .sb-profile__finding { cursor: pointer; }
    .sb-profile__finding:hover, .sb-profile__finding--highlighted { box-shadow: inset 0 0 0 1px var(--sb-accent, #2563eb); }
    .sb-profile__detail { grid-column: 1 / -1; display: grid; gap: 10px; padding: 6px 10px 10px 28px; background: var(--sb-surface-2, #eef0f3); }
    .sb-profile__caption { margin-bottom: 2px; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-profile__values { display: grid; grid-template-columns: minmax(0, max-content) minmax(60px, 200px) max-content; gap: 2px 8px; align-items: center; }
    .sb-profile__value { all: unset; box-sizing: border-box; padding: 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-radius: 4px; cursor: pointer; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }
    .sb-profile__value:hover, .sb-profile .sb-profile__value--highlighted { background: var(--sb-accent-soft, #eaf0ff); box-shadow: inset 0 0 0 1px var(--sb-accent, #2563eb); }
    .sb-profile__value--literal { color: var(--sb-muted, #616e7c); font-style: italic; }
    .sb-profile__value--rare, .sb-profile__value--odd { background: color-mix(in srgb, var(--sb-warn, #d69e2e) 22%, transparent); }
    .sb-profile__bar { height: 8px; border-radius: 2px; background: var(--sb-accent, #2563eb); opacity: 0.7; }
    .sb-profile__count { color: var(--sb-muted, #616e7c); font-variant-numeric: tabular-nums; }
    .sb-profile__more { grid-column: 1 / -1; color: var(--sb-muted, #616e7c); }
    .sb-profile__histogram { display: flex; align-items: flex-end; gap: 2px; height: 48px; max-width: 360px; }
    .sb-profile__bin { flex: 1 1 0; min-height: 1px; background: var(--sb-accent, #2563eb); opacity: 0.7; border-radius: 2px 2px 0 0; }
    .sb-profile__axis { display: flex; justify-content: space-between; max-width: 360px; color: var(--sb-muted, #616e7c); font-size: 11px; font-variant-numeric: tabular-nums; }
    .sb-profile__empty { color: var(--sb-muted, #616e7c); }`;

  // What the summary line calls each kind of finding, one and many.
  const TALLY = {
    'constant': ['constant', 'constants'],
    'unique': ['key', 'keys'],
    'sometimes-missing': ['gap', 'gaps'],
    'mixed-types': ['mixed type', 'mixed types'],
    'rare-values': ['rare value', 'rare values'],
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // A field's name is the last part of its path; its depth, how many parts come before.
  const partsOf = (path) => path.match(/\[\]|[^.[\]]+/g);

  function addStyle() {
    if (document.getElementById('sb-profile-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-profile-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbProfile extends HTMLElement {
    static origin = ORIGIN;

    // The core, so a sandbox can profile samples without drawing anything.
    static profile = profile;

    static observedAttributes = ['empty-text'];

    constructor() {
      super();
      this._samples = [];
      this._options = {};
      this._profile = null;
      this._changes = new Map(); // path → { present, distinct }: what changed since the last update, and from what
      this._gone = []; // [{ field, was }]: fields in the last samples that none of these have
      this._expanded = new Set();
      this._highlight = { fields: [], values: [], kinds: [] };
      this._pointed = null; // what the viewer is pointing at, as last announced in sb-point
      this.addEventListener('click', (e) => this._click(e.target));
      this.addEventListener('pointerover', (e) => this._point(e.target));
      this.addEventListener('pointerleave', () => this._point(null));
      this.addEventListener('focusin', (e) => this._point(e.target));
      this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this._point(null); });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-profile');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // The raw samples. Setting them profiles them, marking what changed since the last samples.
    get samples() { return this._samples; }
    set samples(list) {
      this._samples = list || [];
      this._update();
    }

    // Passed to the core: { limit, id, path }.
    get options() { return this._options; }
    set options(value) {
      this._options = value || {};
      if (this._profile) this._update();
    }

    // The core's last result, read-only.
    get profile() { return this._profile; }

    // Paths of the fields whose values are shown.
    get expanded() { return [...this._expanded]; }
    set expanded(paths) {
      this._expanded = new Set(paths || []);
      this.render();
    }

    // What to point at: { fields: [path], values: [[path, value]], kinds: [finding kind] }.
    get highlight() { return this._highlight; }
    set highlight(value) {
      const { fields = [], values = [], kinds = [] } = value || {};
      this._highlight = { fields, values, kinds };
      this._mark();
    }

    // ---- Profiling ----

    _update() {
      const before = this._profile;
      this._profile = profile(this._samples, this._options);
      this._changes = before ? this._changesSince(before) : new Map();
      this._gone = before ? this._goneSince(before) : [];
      this.render();
    }

    // Presence as shown (a share of the samples), so a smaller set doesn't mark every field.
    _changesSince(before) {
      const presence = (result, field) => percent(field.present, result.count);
      const previous = new Map(before.fields.map((field) => [field.path, field]));
      const changes = new Map();
      for (const field of this._profile.fields) {
        const was = previous.get(field.path);
        if (!was) continue;
        const change = {};
        if (presence(before, was) !== presence(this._profile, field)) change.present = presence(before, was);
        if (was.distinct !== field.distinct) change.distinct = was.distinct;
        if (Object.keys(change).length) changes.set(field.path, change);
      }
      return changes;
    }

    // Fields the last samples had and these don't, with the field before each, to keep its place.
    _goneSince(before) {
      const now = new Set(this._profile.fields.map((field) => field.path));
      return before.fields.flatMap((field, i) => (now.has(field.path) ? [] : [{
        field, was: percent(field.present, before.count), after: before.fields[i - 1]?.path,
      }]));
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      const result = this._profile;
      if (!result || !result.count) {
        this.innerHTML = `<div class="sb-profile__empty">${esc(this.getAttribute('empty-text') || 'No samples yet.')}</div>`;
        return;
      }
      const findings = new Map();
      for (const finding of result.findings) {
        if (!findings.has(finding.path)) findings.set(finding.path, []);
        findings.get(finding.path).push(finding);
      }
      this.innerHTML = `
        ${this._summary(result)}
        <div class="sb-profile__table">
          <div class="sb-profile__head" aria-hidden="true"><span>Field</span><span>Types</span><span>Present</span><span>Distinct</span><span>Findings</span></div>
          ${this._rows(result, findings).join('')}
        </div>`;
      this._mark();
    }

    // A row per field, with each gone field back where it was, so a vanished field is noticed.
    _rows(result, findings) {
      const rows = result.fields.map((field) => ({ path: field.path, html: this._field(field, findings.get(field.path) || [], result.count) }));
      for (const gone of this._gone) {
        const at = rows.findIndex((row) => row.path === gone.after) + 1;
        rows.splice(at, 0, { path: gone.field.path, html: this._goneField(gone) });
      }
      return rows.map((row) => row.html);
    }

    _goneField({ field, was }) {
      const parts = partsOf(field.path);
      return `
        <div class="sb-profile__field sb-profile__field--gone" data-ref="${esc(field.path)}">
          <span class="sb-profile__name" style="padding-left: ${10 + (parts.length - 1) * 16}px" title="${esc(field.path)}">${esc(parts[parts.length - 1])}</span>
          <span class="sb-profile__types"></span>
          <span class="sb-profile__present sb-profile__changed">none <span class="sb-profile__was">was ${esc(was)}</span></span>
          <span class="sb-profile__distinct"></span>
          <span class="sb-profile__findings"></span>
        </div>`;
    }

    _summary(result) {
      const counts = Object.keys(TALLY).map((kind) => [kind, result.findings.filter((f) => f.kind === kind).length]).filter(([, n]) => n);
      const tally = counts.map(([kind, n]) => `<span class="sb-profile__kind" data-kind="${kind}">${n} ${TALLY[kind][n === 1 ? 0 : 1]}</span>`).join(', ');
      return `
        <div class="sb-profile__summary">
          ${result.count} ${result.count === 1 ? 'sample' : 'samples'}, ${result.fields.length} ${result.fields.length === 1 ? 'field' : 'fields'}.
          <span class="sb-profile__tally">${tally ? `Found ${tally}.` : 'Nothing stands out.'}</span>
        </div>`;
    }

    _field(field, findings, count) {
      const parts = partsOf(field.path);
      const expanded = this._expanded.has(field.path);
      const change = this._changes.get(field.path) || {};
      const share = percent(field.present, count);
      const types = Object.entries(field.types).map(([type, n]) => (Object.keys(field.types).length > 1 ? `${type} ${n}` : type)).join(', ');
      return `
        <div class="sb-profile__field" data-ref="${esc(field.path)}">
          <button type="button" class="sb-profile__name" aria-expanded="${expanded}" style="padding-left: ${10 + (parts.length - 1) * 16}px" title="${esc(field.path)}">${esc(parts[parts.length - 1])}</button>
          <span class="sb-profile__types">${esc(types)}</span>
          <span class="sb-profile__present${'present' in change ? ' sb-profile__changed' : ''}">
            <span class="sb-profile__meter"><span style="width: ${(field.present / count) * 100}%"></span></span>
            ${share}${'present' in change ? ` <span class="sb-profile__was">was ${esc(change.present)}</span>` : ''}
          </span>
          <span class="sb-profile__distinct${'distinct' in change ? ' sb-profile__changed' : ''}">
            ${field.distinct || ''}${'distinct' in change ? ` <span class="sb-profile__was">was ${change.distinct}</span>` : ''}
          </span>
          <span class="sb-profile__findings">${findings.map((f) => `<span class="sb-profile__finding" data-kind="${f.kind}" title="${esc(phrase(f))}">${esc(phrase(f))}</span>`).join('')}</span>
          ${expanded ? this._detail(field, findings) : ''}
        </div>`;
    }

    // Numbers as a histogram; values with counts when they're few enough to read, or not numbers.
    _detail(field, findings) {
      const mixed = findings.find((f) => f.kind === 'mixed-types');
      const parts = [
        field.lengths && this._histogram('Lengths', field.lengths),
        field.numbers && this._histogram('Numbers', field.numbers),
        field.values.length && (!field.numbers || !field.more) && this._values(field, findings),
        mixed && `<div class="sb-profile__caption">${esc(phrase(mixed))}, in ${mixed.samples.map((s) => esc(shown(s))).join(', ')}</div>`,
      ].filter(Boolean);
      return `<div class="sb-profile__detail">${parts.join('') || '<div class="sb-profile__caption">No values of its own: see the fields inside it.</div>'}</div>`;
    }

    _histogram(caption, { min, max, mean, histogram }) {
      const most = Math.max(...histogram.map((bin) => bin.count));
      return `
        <div>
          <div class="sb-profile__caption">${caption}: ${esc(min)} to ${esc(max)}, mean ${brief(mean)}</div>
          <div class="sb-profile__histogram">${histogram.map((bin) => `<span class="sb-profile__bin" style="height: ${(bin.count / most) * 100}%" title="${esc(bin.from)} to ${esc(bin.to)}: ${bin.count}"></span>`).join('')}</div>
          <div class="sb-profile__axis"><span>${esc(histogram[0].from)}</span><span>${esc(histogram[histogram.length - 1].to)}</span></div>
        </div>`;
    }

    _values(field, findings) {
      const rare = findings.find((f) => f.kind === 'rare-values')?.values || [];
      const usual = Object.entries(field.types).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
      const most = field.values[0].count;
      return `
        <div class="sb-profile__values">
          ${field.values.map(({ value, count }, index) => {
            const classes = ['sb-profile__value',
              (value === null || value === '') && 'sb-profile__value--literal',
              rare.includes(value) && 'sb-profile__value--rare',
              typeOf(value) !== usual && 'sb-profile__value--odd'].filter(Boolean).join(' ');
            const label = value === '' ? '""' : shown(value);
            const note = rare.includes(value) ? ', seen once' : typeOf(value) !== usual ? `, ${SINGULARS[typeOf(value)]}` : '';
            return `<button type="button" class="${classes}" data-index="${index}" title="${esc(label + note)}">${esc(label)}</button>
              <span class="sb-profile__bar" style="width: ${(count / most) * 100}%"></span>
              <span class="sb-profile__count">${count}</span>`;
          }).join('')}
          ${field.more ? `<span class="sb-profile__more">and ${field.more} more</span>` : ''}
        </div>`;
    }

    // Lights what's highlighted, and every finding of a kind the viewer points at in the summary,
    // by marking what's drawn rather than drawing again.
    _mark() {
      if (!this._profile) return;
      const { fields, values, kinds } = this._highlight;
      const litKinds = this._pointed?.kind && !this._pointed.path ? [...kinds, this._pointed.kind] : kinds;
      const kindsOf = (path) => this._profile.findings.filter((f) => f.path === path).map((f) => f.kind);
      for (const row of this.querySelectorAll('.sb-profile__field')) {
        const path = row.dataset.ref;
        const wanted = values.filter(([at]) => at === path).map(([, value]) => value);
        let shown = 0;
        for (const button of row.querySelectorAll('.sb-profile__value')) {
          const lit = wanted.includes(this._valueOf(path, button.dataset.index));
          button.classList.toggle('sb-profile__value--highlighted', lit);
          if (lit) shown++;
        }
        row.classList.toggle('sb-profile__field--highlighted', fields.includes(path) || kindsOf(path).some((kind) => litKinds.includes(kind)));
        row.classList.toggle('sb-profile__field--holds-highlight', wanted.length > shown);
        for (const badge of row.querySelectorAll('.sb-profile__finding')) {
          badge.classList.toggle('sb-profile__finding--highlighted', litKinds.includes(badge.dataset.kind));
        }
      }
      for (const tally of this.querySelectorAll('.sb-profile__kind')) {
        tally.classList.toggle('sb-profile__kind--highlighted', litKinds.includes(tally.dataset.kind));
      }
    }

    _valueOf(path, index) {
      return this._profile.fields.find((f) => f.path === path).values[index].value;
    }

    // ---- Interaction ----

    // What a part of the profile is about: a count in the summary, a value, a finding, or a field.
    _about(target) {
      const tally = target.closest('.sb-profile__kind');
      if (tally) return { kind: tally.dataset.kind };
      const row = target.closest('.sb-profile__field');
      if (!row) return null;
      const path = row.dataset.ref;
      const value = target.closest('.sb-profile__value');
      if (value) return { path, value: this._valueOf(path, value.dataset.index) };
      const finding = target.closest('.sb-profile__finding');
      if (finding) return { path, kind: finding.dataset.kind };
      return { path };
    }

    // Pointing tells the sandbox, once per change, and lights the findings of a kind in the summary.
    _point(target) {
      const about = target ? this._about(target) : null;
      if (JSON.stringify(about) === JSON.stringify(this._pointed)) return;
      this._pointed = about;
      this._mark();
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: about }));
    }

    // Clicking a name or a finding opens or closes the field's values; clicking a value tells the sandbox.
    _click(target) {
      const row = target.closest('.sb-profile__field');
      if (!row) return;
      const path = row.dataset.ref;
      if (target.closest('.sb-profile__name[aria-expanded], .sb-profile__finding')) {
        if (this._expanded.has(path)) this._expanded.delete(path);
        else this._expanded.add(path);
        this.render();
        [...this.querySelectorAll('.sb-profile__field')].find((r) => r.dataset.ref === path).querySelector('.sb-profile__name').focus();
        return;
      }
      const button = target.closest('.sb-profile__value');
      if (!button) return;
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { path, value: this._valueOf(path, button.dataset.index) } }));
    }
  }

  customElements.define('sb-profile', SbProfile);
})();
