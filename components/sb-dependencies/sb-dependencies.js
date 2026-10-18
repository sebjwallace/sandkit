// Sandkit sb-dependencies 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// What goes with what in a set of same-shaped records: fields that determine others, fields that
// change together, optional fields present together, and near-misses with the samples that break them.
//
//   <sb-dependencies></sb-dependencies>
//   deps.options = { id: 'orderId' };
//   deps.samples = orders;
//   customElements.get('sb-dependencies').dependencies(orders)   // the same answer, drawing nothing
//
// The core comes first and runs anywhere; tools/analyse.mjs runs it from Node.
// See manifest.md for the full contract.
(function () {
  // ---- Core: plain functions, no DOM. Also used by tools/analyse.mjs. ----

  const THRESHOLD = 0.95;
  const MAX_FIELDS = 60;
  const MAX_SAMPLE_REFS = 5;
  const MAX_EXCEPTIONS = 10;
  // Fewer occurrences than this, and fields look unique, or present together, by chance.
  const MIN_EVIDENCE = 5;
  // A rule counts only when each value it goes from is seen this many times on average: a field
  // with nearly as many values as samples determines everything by accident.
  const MIN_SUPPORT = 5;

  function dependencies(samples, options = {}) {
    const { id, path, threshold = THRESHOLD, pairs = false, maxFields = MAX_FIELDS } = options;
    const records = path ? select(samples, path) : samples;
    const refs = records.map((record, index) => {
      if (typeOf(record) !== 'object') throw new Error(`dependencies expects objects, but sample #${index} is ${typeOf(record)}`);
      const value = id ? valueAt(record, id) : undefined;
      return value !== undefined ? value : `#${index}`;
    });

    const fields = gather(records);
    const { considered, skipped } = choose(fields, maxFields);
    const singles = considered.flatMap((from) => {
      const groups = groupsOf([from]);
      return considered.flatMap((to) => ruleFrom([from], to, refs, threshold, groups));
    });
    const doubles = pairs ? pairRules(considered, singles, refs, threshold) : [];
    const groups = changingTogether(considered, singles);

    return {
      count: records.length,
      findings: [
        ...ordered(withChains(standingIn(groups, [...singles, ...doubles]))),
        ...groups.map((group) => ({ kind: 'together', fields: group.map((field) => field.path) })),
        ...presentTogether(fields, records.length),
      ],
      fields: considered.map((field) => field.path),
      skipped,
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

  // ---- Gathering: every field's value in every record, as a small number per distinct value. ----

  // Fields in the order first seen. `codes[record]` is the value's number, or -1 where it's absent;
  // values are told apart as JSON, so 1 and '1' stay different.
  function gather(records) {
    const fields = new Map();
    const fieldAt = (path) => {
      if (!fields.has(path)) fields.set(path, { path, index: fields.size, codes: new Int32Array(records.length).fill(-1), values: [], keys: new Map(), present: 0, arrays: false });
      return fields.get(path);
    };
    const walk = (object, prefix, record) => {
      for (const [key, value] of Object.entries(object)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeOf(value) === 'object') walk(value, path, record);
        else note(fieldAt(path), value, record);
      }
    };
    records.forEach((record, index) => walk(record, '', index));
    return [...fields.values()];
  }

  function note(field, value, record) {
    const key = JSON.stringify(value);
    if (!field.keys.has(key)) { field.keys.set(key, field.values.length); field.values.push(value); }
    field.codes[record] = field.keys.get(key);
    field.present++;
    if (Array.isArray(value)) field.arrays = true;
  }

  // Keys and constants say nothing about other fields, and array elements aren't compared yet.
  function choose(fields, maxFields) {
    const considered = [], skipped = [];
    for (const field of fields) {
      const reason = field.arrays ? 'array'
        : field.values.length === 1 ? 'constant'
        : field.present >= MIN_EVIDENCE && field.values.length === field.present ? 'unique'
        : considered.length >= maxFields ? 'max-fields'
        : null;
      if (reason) skipped.push({ path: field.path, reason });
      else considered.push(field);
    }
    return { considered, skipped };
  }

  // ---- Rules: does knowing `from` tell you `to`? ----

  // The records holding every `from` field, grouped by their values there, in the order first seen.
  function groupsOf(from) {
    const groups = new Map();
    from[0].codes.forEach((_, record) => {
      const codes = from.map((field) => field.codes[record]);
      if (codes.includes(-1)) return;
      const key = codes.join(',');
      if (!groups.has(key)) groups.set(key, { codes, records: [] });
      groups.get(key).records.push(record);
    });
    return [...groups.values()];
  }

  // A rule, or nothing. Compared only where both sides are present. It holds where each group's
  // records share its most usual `to` value, and must make at most half the mistakes of always
  // guessing the most common one, so a field that is nearly constant isn't determined by everything.
  function ruleFrom(from, to, refs, threshold, groups) {
    if (from.includes(to)) return [];
    const totals = new Int32Array(to.values.length);
    const counts = new Int32Array(to.values.length); // one group's counts, cleared after each
    let compared = 0, consistent = 0, seen = 0;
    const mixed = [];
    // Unrelated fields give up early: more mistakes than the threshold allows of every sample that could be compared.
    const allowed = (1 - threshold) * Math.min(to.present, groups.reduce((sum, group) => sum + group.records.length, 0));
    for (const group of groups) {
      const found = [];
      for (const record of group.records) {
        const code = to.codes[record];
        if (code < 0) continue;
        if (counts[code]++ === 0) found.push(code);
        totals[code]++;
        compared++;
      }
      if (!found.length) continue;
      seen++;
      const usual = mostCommon(found, counts);
      consistent += counts[usual];
      if (compared - consistent > allowed) return [];
      if (found.length > 1) mixed.push({ group, counts: new Map(found.map((code) => [code, counts[code]])), usual });
      for (const code of found) counts[code] = 0;
    }
    const guessing = compared - totals.reduce((most, n) => Math.max(most, n), 0);
    const mistakes = compared - consistent;
    if (compared < MIN_SUPPORT * seen || guessing === 0 || mistakes * 2 > guessing) return [];
    const holds = tidy(consistent / compared);
    if (holds < threshold) return [];

    const rule = { kind: 'determines', from: from.map((field) => field.path), to: to.path, holds, of: compared, fromFields: from, toField: to };
    if (mixed.length) Object.assign(rule, exceptionsOf(mixed, from, to, refs));
    return [rule];
  }

  // The most common code, ties to the value first seen, so the same samples give the same answer.
  const mostCommon = (codes, counts) => codes.reduce((best, code) => (counts[code] > counts[best] || (counts[code] === counts[best] && code < best) ? code : best));

  // For each `from` value breaking the rule, the usual `to` value and the odd ones out, with a few
  // samples each; the values with most exceptions first.
  function exceptionsOf(mixed, from, to, refs) {
    const oddCount = ({ counts, usual }) => [...counts.values()].reduce((sum, n) => sum + n, 0) - counts.get(usual);
    const worst = mixed.slice().sort((a, b) => oddCount(b) - oddCount(a));
    const exceptions = worst.slice(0, MAX_EXCEPTIONS).map(({ group, counts, usual }) => ({
      value: Object.fromEntries(from.map((field, i) => [field.path, field.values[group.codes[i]]])),
      usual: to.values[usual],
      odd: [...counts].filter(([code]) => code !== usual).sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([code, count]) => ({
        value: to.values[code],
        count,
        samples: group.records.filter((record) => to.codes[record] === code).slice(0, MAX_SAMPLE_REFS).map((record) => refs[record]),
      })),
    }));
    return worst.length > MAX_EXCEPTIONS ? { exceptions, more: worst.length - MAX_EXCEPTIONS } : { exceptions };
  }

  // Two fields together, only where neither alone already determines the field.
  function pairRules(fields, singles, refs, threshold) {
    const found = new Set(singles.map((rule) => `${rule.from[0]}>${rule.to}`));
    const rules = [];
    fields.forEach((a, i) => fields.slice(i + 1).forEach((b) => {
      const groups = groupsOf([a, b]);
      for (const to of fields) {
        if (found.has(`${a.path}>${to.path}`) || found.has(`${b.path}>${to.path}`)) continue;
        rules.push(...ruleFrom([a, b], to, refs, threshold, groups));
      }
    }));
    return rules;
  }

  // ---- Groups: fields that each determine the other exactly, so they always change together. ----

  function changingTogether(fields, singles) {
    const exact = new Set(singles.filter((rule) => rule.holds === 1).map((rule) => `${rule.from[0]}>${rule.to}`));
    const groupOf = new Map(fields.map((field) => [field, [field]]));
    for (const a of fields) {
      for (const b of fields) {
        if (a.index < b.index && exact.has(`${a.path}>${b.path}`) && exact.has(`${b.path}>${a.path}`) && groupOf.get(a) !== groupOf.get(b)) {
          const merged = [...groupOf.get(a), ...groupOf.get(b)].sort((x, y) => x.index - y.index);
          for (const field of merged) groupOf.set(field, merged);
        }
      }
    }
    return [...new Set(groupOf.values())].filter((group) => group.length > 1).sort((x, y) => x[0].index - y[0].index);
  }

  // A group stands in for its fields: its first field carries the rules to and from it.
  function standingIn(groups, rules) {
    const others = new Set(groups.flatMap((group) => group.slice(1)));
    return rules.filter((rule) => !others.has(rule.toField) && !rule.fromFields.some((field) => others.has(field)));
  }

  // ---- Chains: an exact rule that follows from two others, marked with the field it goes via. ----

  function withChains(rules) {
    const exact = rules.filter((rule) => rule.holds === 1 && rule.from.length === 1);
    const has = new Set(exact.map((rule) => `${rule.from[0]}>${rule.to}`));
    const fields = [...new Set(exact.flatMap((rule) => [rule.fromFields[0], rule.toField]))].sort((a, b) => a.index - b.index);
    const between = (x, z) => fields.filter((y) => y.path !== x && y.path !== z && has.has(`${x}>${y.path}`) && has.has(`${y.path}>${z}`));
    // A step is direct when nothing comes between; a chain goes via its first direct step.
    const direct = (x, y) => !between(x, y).length;
    for (const rule of exact) {
      const via = between(rule.from[0], rule.to);
      if (via.length) rule.via = (via.find((y) => direct(rule.from[0], y.path)) || via[0]).path;
    }
    return rules;
  }

  // Exact rules before near-misses, the strongest near-misses first, then in field order.
  function ordered(rules) {
    const position = (rule) => [...rule.fromFields.map((field) => field.index), Infinity, rule.toField.index];
    const byPosition = (a, b) => {
      const [x, y] = [position(a), position(b)];
      const i = x.findIndex((n, k) => n !== y[k]);
      return i < 0 ? 0 : x[i] - y[i];
    };
    const exact = (rule) => (rule.holds === 1 ? 0 : 1);
    return rules.sort((a, b) => exact(a) - exact(b) || b.holds - a.holds || byPosition(a, b))
      .map(({ fromFields, toField, ...finding }) => finding);
  }

  // ---- Presence: optional fields that are there together or not at all. ----

  function presentTogether(fields, count) {
    const groups = new Map();
    for (const field of fields) {
      if (field.present < MIN_EVIDENCE || count - field.present < MIN_EVIDENCE) continue;
      const where = field.codes.reduce((list, code, record) => (code < 0 ? list : `${list},${record}`), '');
      if (!groups.has(where)) groups.set(where, []);
      groups.get(where).push(field);
    }
    return [...groups.values()].filter((group) => group.length > 1)
      .map((group) => ({ kind: 'present-together', fields: group.map((field) => field.path), present: group[0].present }));
  }

  // Clears floating-point dust such as 0.30000000000000004.
  const tidy = (n) => Number(n.toPrecision(12));

  // ---- Words: findings as the element and tools/analyse.mjs --md both say them. ----

  const shown = (value) => (typeof value === 'string' ? value : JSON.stringify(value));
  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  // How many samples break a rule.
  const broken = (finding) => Math.round(finding.of * (1 - finding.holds));

  // Rounded down, so a near-miss never reads as 100%.
  const percent = (share) => `${Math.floor(tidy(share * 1000)) / 10}%`;

  const REASONS = { unique: 'every value different', constant: 'always the same', array: 'holds arrays', 'max-fields': 'over the field limit' };

  // "4 rules, 1 near-miss, 1 group that changes together", leaving out what wasn't found.
  function summary(result) {
    const counted = (kind, test = () => true) => result.findings.filter((f) => f.kind === kind && test(f)).length;
    const exact = counted('determines', (f) => f.holds === 1);
    const near = counted('determines', (f) => f.holds < 1);
    const together = counted('together');
    const present = counted('present-together');
    const parts = [
      exact && plural(exact, 'rule'),
      near && plural(near, 'near-miss', 'near-misses'),
      together && `${plural(together, 'group')} that ${together === 1 ? 'changes' : 'change'} together`,
      present && `${plural(present, 'group')} always present together`,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Nothing goes with anything';
  }

  // "holds in 99.7%: 3 exceptions"
  const strength = (finding) => `holds in ${percent(finding.holds)}: ${plural(broken(finding), 'exception')}`;

  // "GB usually goes with 0.2, but 0.05 in 3 samples"
  function exceptionPhrase(exception) {
    const from = Object.values(exception.value).map(shown).join(', ');
    const odd = exception.odd.map((o) => `${shown(o.value)} in ${plural(o.count, 'sample')}`).join(', ');
    return `${from} usually goes with ${shown(exception.usual)}, but ${odd}`;
  }

  const skippedPhrase = (skip) => `${skip.path} (${REASONS[skip.reason]})`;

  // A short readable summary: near-misses and their exceptions first, then rules, then groups.
  function markdown(result) {
    const code = (path) => `\`${path}\``;
    const rule = (f) => `${f.from.map(code).join(' and ')} determines ${code(f.to)}`;
    const near = result.findings.filter((f) => f.kind === 'determines' && f.holds < 1);
    const exact = result.findings.filter((f) => f.kind === 'determines' && f.holds === 1);
    const groups = (kind) => result.findings.filter((f) => f.kind === kind);
    const section = (title, lines) => (lines.length ? [`## ${title}`, '', ...lines, ''] : []);

    return [
      `# Dependencies in ${result.count} samples`, '',
      `${summary(result)}. Rules are inferences and exceptions are questions until someone confirms them.`, '',
      ...section('Near-misses', near.flatMap((f) => [
        `- ${rule(f)} (${strength(f)})`,
        ...f.exceptions.map((e) => `  - ${exceptionPhrase(e)} (${e.odd.flatMap((o) => o.samples).map(shown).join(', ')})`),
        ...(f.more ? [`  - and ${plural(f.more, 'more value')} with exceptions`] : []),
      ])),
      ...section('Rules', exact.map((f) => `- ${rule(f)}${f.via ? ` (via ${code(f.via)})` : ''}`)),
      ...section('Change together', groups('together').map((f) => `- ${f.fields.map(code).join(', ')}`)),
      ...section('Present together', groups('present-together').map((f) => `- ${f.fields.map(code).join(', ')} (in ${f.present} of ${result.count})`)),
      ...section('Not considered', result.skipped.map((s) => `- ${code(s.path)}: ${REASONS[s.reason]}`)),
    ].join('\n');
  }

  dependencies.markdown = markdown;
  dependencies.flags = ['pairs']; // options tools/analyse.mjs takes without a value
  const core = { dependencies };

  // ---- Node: hand the core to tools. ----
  if (typeof module !== 'undefined' && module.exports) module.exports = core;

  // ---- Browser: the element. ----
  if (typeof customElements === 'undefined') return;

  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-dependencies';
  const existing = customElements.get('sb-dependencies');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-dependencies>, so only one can run. Rename one by replacing every "sb-dependencies" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-dependencies { display: block; font-size: 13px; }
    .sb-dependencies__summary { margin-bottom: 6px; color: var(--sb-muted, #616e7c); }
    .sb-dependencies__heading { margin: 10px 0 4px; font-size: 12px; font-weight: 600; color: var(--sb-muted, #616e7c); }
    .sb-dependencies__list { margin: 0; padding: 0; list-style: none; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); }
    .sb-dependencies__row { padding: 5px 10px; border-bottom: 1px solid var(--sb-surface-2, #eef0f3); line-height: 1.8; }
    .sb-dependencies__row:last-child { border-bottom: 0; }
    .sb-dependencies__row--near { box-shadow: inset 3px 0 0 var(--sb-warn, #d69e2e); }
    .sb-dependencies__field { padding: 1px 4px; border-radius: 4px; background: var(--sb-surface-2, #eef0f3); font: 12px ui-monospace, Menlo, Consolas, monospace; white-space: nowrap; }
    .sb-dependencies__item { white-space: nowrap; }
    .sb-dependencies__item--gone .sb-dependencies__field { color: var(--sb-muted, #616e7c); text-decoration: line-through; }
    .sb-dependencies__strength { all: unset; box-sizing: border-box; padding: 0 6px; border-radius: 4px; cursor: pointer; font-size: 12px; background: color-mix(in srgb, var(--sb-warn, #d69e2e) 22%, transparent); }
    .sb-dependencies__strength::before { content: '▸ '; }
    .sb-dependencies__strength[aria-expanded="true"]::before { content: '▾ '; }
    .sb-dependencies__strength:hover { box-shadow: inset 0 0 0 1px var(--sb-warn, #d69e2e); }
    .sb-dependencies__mark { padding: 0 5px; border-radius: 4px; font-size: 11px; color: var(--sb-text, #1f2933); background: color-mix(in srgb, var(--sb-warn, #d69e2e) 20%, transparent); }
    .sb-dependencies__exceptions { margin: 2px 0 2px 12px; padding: 0; list-style: none; font-size: 12px; line-height: 1.6; }
    .sb-dependencies__samples { all: unset; cursor: pointer; color: var(--sb-accent, #2563eb); text-decoration: underline; }
    .sb-dependencies__strength:focus-visible, .sb-dependencies__samples:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-dependencies__more { color: var(--sb-muted, #616e7c); }
    .sb-dependencies__skipped { margin-top: 10px; color: var(--sb-muted, #616e7c); font-size: 12px; line-height: 1.8; }
    .sb-dependencies__empty { color: var(--sb-muted, #616e7c); }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // A finding's identity across updates: what it goes from and to, or the fields in its group.
  const keyOf = (finding) => (finding.kind === 'determines' ? `${finding.from.join('+')}>${finding.to}` : `${finding.kind}:${finding.fields.join('+')}`);

  const field = (path) => `<code class="sb-dependencies__field" data-ref="${esc(path)}">${esc(path)}</code>`;

  function addStyle() {
    if (document.getElementById('sb-dependencies-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-dependencies-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbDependencies extends HTMLElement {
    static origin = ORIGIN;

    // The core, so a sandbox can find dependencies without drawing anything.
    static dependencies = dependencies;

    static observedAttributes = ['empty-text'];

    constructor() {
      super();
      this._samples = [];
      this._options = {};
      this._result = null;
      this._changes = new Map(); // finding key → { new: true } or { was: holds }, since the last update
      this._gone = []; // findings in the last result that these samples don't show
      this._expanded = new Set(); // keys of near-misses whose exceptions are shown
      this.addEventListener('click', (e) => this._click(e.target));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-dependencies');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    // ---- Public API ----

    // The raw samples. Setting them finds what goes with what, marking what changed since the last samples.
    get samples() { return this._samples; }
    set samples(list) {
      this._samples = list || [];
      this._update();
    }

    // Passed to the core: { id, threshold, pairs, path, maxFields }.
    get options() { return this._options; }
    set options(value) {
      this._options = value || {};
      if (this._result) this._update();
    }

    // The core's last result, read-only.
    get dependencies() { return this._result; }

    // ---- Analysing ----

    _update() {
      const before = this._result;
      this._result = dependencies(this._samples, this._options);
      const previous = new Map((before?.findings || []).map((finding) => [keyOf(finding), finding]));
      const now = new Set(this._result.findings.map(keyOf));
      this._changes = new Map();
      if (before) {
        for (const finding of this._result.findings) {
          const was = previous.get(keyOf(finding));
          if (!was) this._changes.set(keyOf(finding), { new: true });
          else if (was.holds !== finding.holds) this._changes.set(keyOf(finding), { was: was.holds });
        }
      }
      this._gone = [...previous.values()].filter((finding) => !now.has(keyOf(finding)));
      this.render();
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      const result = this._result;
      if (!result || !result.count) {
        this.innerHTML = `<div class="sb-dependencies__empty">${esc(this.getAttribute('empty-text') || 'No samples yet.')}</div>`;
        return;
      }
      const all = [...result.findings, ...this._gone];
      const of = (kind) => all.filter((finding) => finding.kind === kind);
      this.innerHTML = `
        <div class="sb-dependencies__summary">${esc(summary(result))}.${this._changeTally()}</div>
        ${this._section('Determines', this._ruleRows(of('determines')))}
        ${this._section('Change together', of('together').map((f) => this._groupRow(f, 'change together')))}
        ${this._section('Present together', of('present-together').map((f) => this._groupRow(f, this._gone.includes(f) ? 'present together' : `present together, in ${f.present} of ${result.count}`)))}
        ${result.skipped.length ? `<div class="sb-dependencies__skipped">Not considered: ${result.skipped.map((s) => `${field(s.path)} (${esc(REASONS[s.reason])})`).join(', ')}</div>` : ''}`;
    }

    // "Since the last samples: 2 new, 1 gone, 1 changed."
    _changeTally() {
      const changes = [...this._changes.values()];
      const parts = [
        [changes.filter((c) => c.new).length, 'new'],
        [this._gone.length, 'gone'],
        [changes.filter((c) => 'was' in c).length, 'changed'],
      ].filter(([n]) => n).map(([n, word]) => `${n} ${word}`);
      return parts.length ? ` Since the last samples: ${parts.join(', ')}.` : '';
    }

    _section(heading, rows) {
      return rows.length ? `<div class="sb-dependencies__heading">${heading}</div><ul class="sb-dependencies__list">${rows.join('')}</ul>` : '';
    }

    // One row per field (or pair) a rule goes from, rows holding a near-miss first.
    _ruleRows(findings) {
      const rows = new Map();
      for (const finding of findings) {
        const from = finding.from.join('+');
        if (!rows.has(from)) rows.set(from, []);
        rows.get(from).push(finding);
      }
      const near = (row) => row.some((f) => f.holds < 1 && !this._gone.includes(f));
      return [...rows.values()].sort((a, b) => near(b) - near(a)).map((row) => this._ruleRow(row, near(row)));
    }

    _ruleRow(row, near) {
      const items = this._chains(row);
      const opened = items.filter(({ finding }) => this._expanded.has(keyOf(finding)));
      return `
        <li class="sb-dependencies__row${near ? ' sb-dependencies__row--near' : ''}">
          ${row[0].from.map(field).join(' and ')} determines
          ${items.map((item) => this._item(item)).join(', ')}
          ${opened.map(({ finding }) => this._exceptions(finding)).join('')}
        </li>`;
    }

    // Each rule as the chain it ends: a rule via another field is drawn through it, and a rule
    // already drawn at the start of a longer chain isn't drawn again, unless it has changed.
    _chains(row) {
      const items = row.map((finding) => ({ finding, chain: this._chain(finding.from, finding.to) }));
      const prefix = (a, b) => a.length < b.length && a.every((path, i) => path === b[i]);
      const marked = (finding) => this._changes.has(keyOf(finding)) || this._gone.includes(finding);
      return items.filter((item) => marked(item.finding) || !items.some((other) => prefix(item.chain, other.chain)));
    }

    // The fields from `from` to `to`, through every via: x → z via y is x → y, then y → z.
    _chain(from, to, depth = 0) {
      const rule = this._result.findings.find((f) => f.kind === 'determines' && f.from.join('+') === from.join('+') && f.to === to);
      if (!rule?.via || depth > this._result.fields.length) return [to];
      return [...this._chain(from, rule.via, depth + 1), ...this._chain([rule.via], to, depth + 1)];
    }

    _item({ finding, chain }) {
      const gone = this._gone.includes(finding);
      const button = finding.holds < 1 && !gone
        ? `<button type="button" class="sb-dependencies__strength" data-key="${esc(keyOf(finding))}" aria-expanded="${this._expanded.has(keyOf(finding))}">${esc(strength(finding))}</button>`
        : '';
      const parts = [chain.map(field).join(' → '), button, this._mark(finding)].filter(Boolean);
      return `<span class="sb-dependencies__item${gone ? ' sb-dependencies__item--gone' : ''}">${parts.join(' ')}</span>`;
    }

    // What changed since the last samples, in words.
    _mark(finding) {
      const change = this._changes.get(keyOf(finding));
      const words = this._gone.includes(finding) ? 'gone'
        : change?.new ? 'new'
        : change ? `was ${change.was === 1 ? 'exact' : percent(change.was)}`
        : '';
      return words ? `<span class="sb-dependencies__mark">${words}</span>` : '';
    }

    _exceptions(finding) {
      const key = esc(keyOf(finding));
      return `
        <ul class="sb-dependencies__exceptions">
          ${finding.exceptions.map((exception, i) => `
            <li>${field(finding.to)}: ${esc(exceptionPhrase(exception))}:
              <button type="button" class="sb-dependencies__samples" data-key="${key}" data-exception="${i}">${esc(exception.odd.flatMap((o) => o.samples).map(shown).join(', '))}</button></li>`).join('')}
          ${finding.more ? `<li class="sb-dependencies__more">and ${esc(plural(finding.more, 'more value'))} with exceptions</li>` : ''}
        </ul>`;
    }

    _groupRow(finding, words) {
      const gone = this._gone.includes(finding);
      return `<li class="sb-dependencies__row"><span class="sb-dependencies__item${gone ? ' sb-dependencies__item--gone' : ''}">${finding.fields.map(field).join(', ')}</span> ${esc(words)} ${this._mark(finding)}</li>`;
    }

    // ---- Interaction ----

    // Clicking a near-miss's strength opens or closes its exceptions; clicking an exception's samples tells the sandbox.
    _click(target) {
      const button = target.closest('.sb-dependencies__strength, .sb-dependencies__samples');
      if (!button) return;
      const key = button.dataset.key;
      const finding = this._result.findings.find((f) => keyOf(f) === key);
      if (button.matches('.sb-dependencies__strength')) {
        if (this._expanded.has(key)) this._expanded.delete(key);
        else this._expanded.add(key);
        this.render();
        [...this.querySelectorAll('.sb-dependencies__strength')].find((b) => b.dataset.key === key).focus();
        return;
      }
      const samples = finding.exceptions[button.dataset.exception].odd.flatMap((o) => o.samples);
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { samples, finding } }));
    }
  }

  customElements.define('sb-dependencies', SbDependencies);
})();
