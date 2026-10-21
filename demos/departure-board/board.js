// The departure board's shared parts, used by both ways of programming it (tables and graph):
// the saved state, the board, the trains, changing rules, and highlighting. A page adds renderLogic(rows) and calls startBoard().

const STORAGE_KEY = 'departure-board-config';
const DATA_KEY = 'departure-board-data';
const EDITS_KEY = 'departure-board-trains';
const PINS_KEY = 'departure-board-pins';
const PAGES = [{ href: 'index.html', title: 'Rules' }, { href: 'example.html', title: 'By example' }, { href: 'catalog.html', title: 'Catalog' }];
let config;
let data;
let edits;
let pins;

// Small helpers.

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

const copy = value => JSON.parse(JSON.stringify(value));
const classes = (...names) => names.filter(Boolean).join(' ');

function remembered(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function remember(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// Two hidden trains look the same to passengers, whatever else their rules say.
function sameShows(a, b) {
  if (a.show.text === 'hide' && b.show.text === 'hide') return true;
  return Object.keys(TABLES).every(table => a[table].text === b[table].text && a[table].tone === b[table].tone);
}

// The board.

function boardCell(shown, ref) {
  return `<span class="tone-${shown.tone}" data-ref="${ref}">${escapeHtml(shown.text)}</span>`;
}

function wasLine(before) {
  if (before.shows.show.text === 'hide') return 'was: hidden';
  return `was: ${before.shows.expected.text || '(blank)'} · platform ${before.shows.platform.text || '(blank)'}${before.shows.note.text ? ` · ${before.shows.note.text}` : ''}`;
}

function boardRow(row, before) {
  const hidden = row.shows.show.text === 'hide';
  const changed = !sameShows(row.shows, before.shows);
  const id = row.train.id;
  return `
    <div class="${classes('board-train', hidden && 'is-hidden', changed && 'is-changed')}" data-train="${row.train.id}">
      <div class="board-row">
        <span data-ref="${id}.time">${row.train.time}</span>
        <span data-ref="${id}.destination">${escapeHtml(row.train.destination)}</span>
        ${boardCell(row.shows.platform, `${id}.board.platform`)}
        ${boardCell(row.shows.expected, `${id}.board.expected`)}
      </div>
      ${row.shows.note.text ? `<div class="board-note">${boardCell(row.shows.note, `${id}.board.note`)}</div>` : ''}
      ${changed ? `<div class="board-was">${escapeHtml(wasLine(before))}</div>` : ''}
    </div>`;
}

function renderBoard(rows, originalRows) {
  const head = `
    <div class="board-title"><span>${STATION}</span><span>${data.now}</span></div>
    <div class="board-head board-row"><span>Time</span><span>Destination</span><span>Plat</span><span>Expected</span></div>`;
  const byTime = rows.map((row, i) => [row, originalRows[i]]).sort(([a], [b]) => minutes(a.train.time) - minutes(b.train.time));
  document.getElementById('board').innerHTML = head + byTime.map(([row, before]) => boardRow(row, before)).join('');
  const changed = rows.filter((row, i) => !sameShows(row.shows, originalRows[i].shows)).length;
  const hidden = rows.filter(row => row.shows.show.text === 'hide').length;
  document.getElementById('summary').textContent =
    `${changed ? `${changed} of ${rows.length} trains show something different from the original.` : 'The board shows exactly what the original does.'} ` +
    `${hidden} hidden from passengers, shown faint here.`;
}

// The trains: the input data, edited in a working copy of each set. The set itself is never changed.

const FIELDS = [
  ['time', 'time'], ['destination', 'text'], ['delay', 'number'], ['platform', 'text'], ['planned', 'text'],
  ['confirmed', 'checkbox'], ['cancelled', 'checkbox'], ['departed', 'checkbox'], ['reason', 'text'],
];

const trainsOf = preset => edits[preset.id] ?? preset.trains;
const moment = () => ({ now: data.now, trains: trainsOf(data) });
const originalTrain = id => data.trains.find(train => train.id === id);

function trainChanged(train, field) {
  const before = originalTrain(train.id);
  return !before || before[field] !== train[field];
}

function fieldInput(train, [field, type]) {
  const changed = trainChanged(train, field) ? 'is-changed' : '';
  if (type === 'checkbox') return `<input type="checkbox" data-field="${field}" class="${changed}" ${train[field] ? 'checked' : ''}>`;
  const placeholder = field === 'delay' ? 'unknown' : '';
  return `<input type="${type}" data-field="${field}" class="${changed}" value="${escapeHtml(train[field] ?? '')}" placeholder="${placeholder}">`;
}

const factPills = facts => Object.values(facts).map(value => `<span class="fact">${value}</span>`).join('');

function renderInputs(rows) {
  const heads = ['Train', 'Time', 'Destination', 'Delay (min)', 'Platform', 'Planned', 'Confirmed', 'Cancelled', 'Departed', 'Reason', 'Facts', ''];
  const body = rows.map(({ train, facts }) => `
    <tr data-train="${train.id}" class="${originalTrain(train.id) ? '' : 'is-new'}">
      <td class="rule-id">${train.id}</td>
      ${FIELDS.map(field => `<td data-ref="${train.id}.${field[0]}">${fieldInput(train, field)}</td>`).join('')}
      <td class="facts">${factPills(facts)}</td>
      <td class="rule-actions"><button type="button" data-train-action="remove" title="Remove">✕</button></td>
    </tr>`).join('');
  document.getElementById('inputs').innerHTML = `<tr>${heads.map(head => `<th>${head}</th>`).join('')}</tr>${body}`;
}

function editTrains(change) {
  edits[data.id] ??= copy(data.trains);
  change(edits[data.id]);
  remember(EDITS_KEY, edits);
}

function newTrain(trains) {
  const prefix = data.trains[0].id[0];
  const number = Math.max(0, ...trains.map(train => Number(train.id.slice(1)))) + 1;
  return { id: prefix + number, time: data.now, destination: 'New train', delay: 0, platform: '1', planned: '1', confirmed: true, cancelled: false, departed: false, reason: '' };
}

function readField(input) {
  if (input.type === 'checkbox') return input.checked;
  if (input.type === 'number') return input.value === '' ? null : Number(input.value);
  return input.value;
}

// Editing a field redraws everything but the trains table, so the cursor stays where it is.
function onTrainField(event) {
  const input = event.target.closest('[data-field]');
  if (!input) return;
  const id = input.closest('[data-train]').dataset.train;
  editTrains(trains => { trains.find(train => train.id === id)[input.dataset.field] = readField(input); });
  const row = runBoard(config, moment()).find(row => row.train.id === id);
  input.classList.toggle('is-changed', trainChanged(row.train, input.dataset.field));
  input.closest('tr').querySelector('.facts').innerHTML = factPills(row.facts);
  renderOutputs();
}

function onTrainAction(event) {
  const button = event.target.closest('[data-train-action]');
  if (!button) return;
  const action = button.dataset.trainAction;
  if (action === 'add') editTrains(trains => trains.push(newTrain(trains)));
  if (action === 'remove') editTrains(trains => trains.splice(trains.findIndex(train => train.id === button.closest('[data-train]').dataset.train), 1));
  if (action === 'reset') { delete edits[data.id]; remember(EDITS_KEY, edits); }
  render();
}

function renderDataChoice() {
  document.getElementById('data').innerHTML = DATA.map(preset =>
    `<option value="${preset.id}" ${preset === data ? 'selected' : ''}>${escapeHtml(preset.name)} · ${preset.now}${edits[preset.id] ? ' (edited)' : ''}</option>`).join('');
}

function useData(id) {
  data = DATA.find(preset => preset.id === id) ?? DATA[0];
  remember(DATA_KEY, data.id);
  render();
}

// Changing the rules.

const originalRule = (table, id) => ORIGINAL[table].find(rule => rule.id === id);

function saveConfig() {
  remember(STORAGE_KEY, config);
}

function nextId(table) {
  const used = [...ORIGINAL[table], ...config[table]].map(rule => Number(rule.id.slice(1)));
  return TABLES[table].prefix + (Math.max(...used) + 1);
}

function cycle(values, current) {
  const options = [undefined, ...values];
  return options[(options.indexOf(current) + 1) % options.length];
}

function change(table, ruleId, action, target) {
  const rules = config[table];
  const index = rules.findIndex(rule => rule.id === ruleId);
  const rule = rules[index];
  if (action === 'cycle') {
    const fact = target.dataset.fact;
    const value = cycle(FACTS[fact].values, rule.when[fact]);
    if (value) rule.when[fact] = value; else delete rule.when[fact];
  }
  if (action === 'tone') rule.then.tone = cycle(TONES, rule.then.tone) ?? TONES[0];
  if (action === 'text') rule.then.text = target.value;
  if (action === 'up' && index > 0) rules.splice(index - 1, 0, ...rules.splice(index, 1));
  if (action === 'remove') rules.splice(index, 1);
  if (action === 'add') {
    const then = { text: TABLES[table].texts[0], ...(TABLES[table].toned && { tone: 'plain' }) };
    rules.splice(Math.max(rules.length - 1, 0), 0, { id: nextId(table), when: {}, then });
  }
}

// Highlighting. A ref is a train or a rule (T3, E3), or a part of one written as a path:
// a train's input (T3.delay), what the board shows for it (T3.board.expected), a rule's condition (E3.when.delay)
// or its result (E3.then). Every ref has a trace: what to light with it, worked out afresh after every change.

const emptyTrace = () => ({ trains: [], rules: [], refs: [], fields: [], feeds: [], facts: [], conditions: [], results: [], outputs: [] });

const tableOf = ruleId => Object.keys(TABLES).find(table => config[table].some(rule => rule.id === ruleId));
const ruleById = ruleId => config[tableOf(ruleId)]?.find(rule => rule.id === ruleId);

function addCondition(trace, rule, fact) {
  trace.refs.push(`${rule.id}.when.${fact}`);
  trace.facts.push(`${fact}=${rule.when[fact]}`);
  trace.conditions.push(`${rule.id}:${fact}`);
}

function addResult(trace, table, rule) {
  trace.refs.push(`${rule.id}.then`);
  trace.results.push(rule.id);
  trace.outputs.push(table);
}

function addFields(trace, trainId, fields, facts = []) {
  trace.fields.push(...fields);
  trace.refs.push(...fields.map(field => `${trainId}.${field}`));
  for (const fact of facts) trace.feeds.push(...FEEDS[fact].filter(field => fields.includes(field)).map(field => `${field}:${fact}`));
}

// The whole of a train: everything it passes through.
function traceTrain(trace, row) {
  trace.trains.push(row.train.id);
  addFields(trace, row.train.id, [...new Set(Object.values(FEEDS).flat())], Object.keys(FEEDS));
  trace.facts.push(...Object.entries(row.facts).map(([fact, value]) => `${fact}=${value}`));
  for (const table of Object.keys(TABLES)) {
    const rule = ruleById(row.fired[table]);
    if (!rule) continue;
    trace.rules.push(rule.id);
    Object.keys(rule.when).forEach(fact => addCondition(trace, rule, fact));
    addResult(trace, table, rule);
  }
}

// One input, downstream: the facts it feeds, and in each part the rule that applied, if it used them, and what it showed.
function traceInput(trace, row, field) {
  const fed = Object.keys(FEEDS).filter(fact => FEEDS[fact].includes(field));
  addFields(trace, row.train.id, [field], fed);
  trace.facts.push(...fed.map(fact => `${fact}=${row.facts[fact]}`));
  for (const table of Object.keys(TABLES)) {
    const rule = ruleById(row.fired[table]);
    if (!rule) continue;
    const uses = Object.keys(rule.when).filter(fact => fed.includes(fact));
    if (!uses.length && !fieldsFilling(rule.then.text).includes(field)) continue;
    uses.forEach(fact => addCondition(trace, rule, fact));
    addResult(trace, table, rule);
    trace.refs.push(`${row.train.id}.board.${table}`);
  }
}

// One thing on the board, upstream: the rule that decided it, its conditions, and the inputs behind them.
function traceOutput(trace, row, table) {
  trace.refs.push(`${row.train.id}.board.${table}`);
  const rule = ruleById(row.fired[table]);
  if (!rule) return;
  const facts = Object.keys(rule.when);
  facts.forEach(fact => addCondition(trace, rule, fact));
  addResult(trace, table, rule);
  addFields(trace, row.train.id, [...new Set([...facts.flatMap(fact => FEEDS[fact]), ...fieldsFilling(rule.then.text)])], facts);
}

function traceRule(trace, rule, path, rows) {
  const table = tableOf(rule.id);
  const decided = rows.filter(row => row.fired[table] === rule.id).map(row => row.train.id);
  if (path[0] === 'when') return addCondition(trace, rule, path[1]);
  if (path[0] !== 'then') {
    trace.trains.push(...decided);
    trace.rules.push(rule.id);
    Object.keys(rule.when).forEach(fact => addCondition(trace, rule, fact));
  }
  addResult(trace, table, rule);
  trace.refs.push(...decided.map(id => `${id}.board.${table}`));
}

function traceOf(ref, rows) {
  const trace = emptyTrace();
  if (!ref) return trace;
  const [id, ...path] = ref.split('.');
  const row = rows.find(candidate => candidate.train.id === id);
  if (row && !path.length) traceTrain(trace, row);
  else if (row && path[0] === 'board') traceOutput(trace, row, path[1]);
  else if (row) traceInput(trace, row, path[0]);
  else if (ruleById(id)) traceRule(trace, ruleById(id), path, rows);
  return trace;
}

function mergeTraces(traces) {
  const merged = emptyTrace();
  for (const trace of traces) for (const key of Object.keys(merged)) merged[key].push(...trace[key]);
  return merged;
}

// Lights everything a trace names: trains, rules and parts by their marks, and anything a page adds
// through partsOf(trace) and its own data-part marks. A collapsed train or rule in the outliner lights for its parts.
function mark(className, trace) {
  document.querySelectorAll(`.${className}`).forEach(element => element.classList.remove(className));
  const select = (attribute, ids) => new Set(ids).forEach(id =>
    document.querySelectorAll(`[${attribute}="${id}"]`).forEach(element => element.classList.add(className)));
  select('data-train', trace.trains);
  select('data-rule', trace.rules);
  select('data-ref', trace.refs);
  select('data-collapsed', trace.refs.map(ref => ref.split('.')[0]));
  if (typeof partsOf === 'function') select('data-part', partsOf(trace));
}

function pointAt(ref) {
  mark('is-lit', traceOf(ref, runBoard(config, moment())));
}

function onPoint(event) {
  const element = event.target.closest('[data-ref], [data-train], [data-rule]');
  pointAt(element?.dataset.ref ?? element?.dataset.train ?? element?.dataset.rule);
}

// The highlights outliner: every train and rule, opening into their parts, each pinned as a fill, an outline, both or neither.

const PIN_KINDS = ['fill', 'outline'];
const OPEN_KEY = 'departure-board-open';
let openItems = new Set(remembered(OPEN_KEY) ?? []);

function markPins(rows) {
  for (const kind of PIN_KINDS) mark(`is-pinned-${kind}`, mergeTraces([...pins[kind]].map(ref => traceOf(ref, rows))));
  document.querySelectorAll('[data-pin]').forEach(button =>
    button.setAttribute('aria-pressed', pins[button.dataset.kind].has(button.dataset.pin)));
}

const ruleSummary = rule => `${Object.values(rule.when).join(', ') || 'anything'} → ${rule.then.text || '(blank)'}`;

function pinButtons(ref) {
  return `
    <button type="button" class="pin pin-fill" data-pin="${ref}" data-kind="fill" title="Keep ${ref} filled"></button>
    <button type="button" class="pin pin-outline" data-pin="${ref}" data-kind="outline" title="Keep ${ref} outlined"></button>`;
}

// A train or rule, with its parts beneath it when open. parts: [{ ref, label }] or headings as { heading }.
function outlineItem(attribute, id, label, parts) {
  const isOpen = openItems.has(id);
  const children = parts.map(part => part.heading
    ? `<div class="outline-heading">${part.heading}</div>`
    : `<div class="chip is-part" data-ref="${part.ref}"><span class="chip-label">${escapeHtml(part.label)}</span>${pinButtons(part.ref)}</div>`).join('');
  return `
    <div class="chip" ${attribute}="${id}" ${isOpen ? '' : `data-collapsed="${id}"`}>
      <button type="button" class="caret" data-toggle="${id}" aria-expanded="${isOpen}" title="${isOpen ? 'Close' : 'Open'}">${isOpen ? '▾' : '▸'}</button>
      <span class="chip-ref">${id}</span><span class="chip-label">${escapeHtml(label)}</span>${pinButtons(id)}
    </div>
    ${isOpen ? `<div class="outline-parts">${children}</div>` : ''}`;
}

const shownValue = value => typeof value === 'boolean' ? (value ? 'yes' : 'no') : (value ?? 'unknown') === '' ? '–' : (value ?? 'unknown');

function trainParts({ train, shows }) {
  return [
    { heading: 'Inputs' },
    ...FIELDS.map(([field]) => ({ ref: `${train.id}.${field}`, label: `${field}: ${shownValue(train[field])}` })),
    { heading: 'On the board' },
    ...Object.keys(TABLES).map(table => ({ ref: `${train.id}.board.${table}`, label: `${TABLES[table].label}: ${shows[table].text || '(blank)'}` })),
  ];
}

function ruleParts(rule) {
  return [
    ...Object.entries(rule.when).map(([fact, value]) => ({ ref: `${rule.id}.when.${fact}`, label: `when ${FACTS[fact].label}: ${value}` })),
    { ref: `${rule.id}.then`, label: `→ ${rule.then.text || '(blank)'}${rule.then.tone ? ` · ${rule.then.tone}` : ''}` },
  ];
}

function renderHighlights(rows) {
  const trains = [...rows].sort((a, b) => minutes(a.train.time) - minutes(b.train.time))
    .map(row => outlineItem('data-train', row.train.id, `${row.train.time} ${row.train.destination}`, trainParts(row))).join('');
  const tables = Object.keys(TABLES).map(table => `
    <h4>${TABLES[table].label}</h4>
    ${config[table].map(rule => outlineItem('data-rule', rule.id, ruleSummary(rule), ruleParts(rule))).join('')}`).join('');
  document.getElementById('highlights').innerHTML = `<h4>Trains</h4>${trains}${tables}`;
  // Pins on trains, rules or parts that no longer exist are dropped.
  const known = new Set([
    ...rows.flatMap(row => [row.train.id, ...trainParts(row).map(part => part.ref)]),
    ...Object.values(config).flat().flatMap(rule => [rule.id, ...ruleParts(rule).map(part => part.ref)]),
  ]);
  PIN_KINDS.forEach(kind => pins[kind].forEach(ref => { if (!known.has(ref)) pins[kind].delete(ref); }));
  markPins(rows);
}

// Glowing makes pinned highlights fade gently in and out, remembered per viewer.
const GLOW_KEY = 'departure-board-glow';

function setGlow(on) {
  document.body.classList.toggle('pins-glow', on);
  document.querySelector('[data-glow]').setAttribute('aria-pressed', on);
  remember(GLOW_KEY, on);
}

function onPin(event) {
  if (event.target.closest('[data-glow]')) return setGlow(!document.body.classList.contains('pins-glow'));
  const toggle = event.target.closest('[data-toggle]');
  if (toggle) {
    if (!openItems.delete(toggle.dataset.toggle)) openItems.add(toggle.dataset.toggle);
    remember(OPEN_KEY, [...openItems]);
    return renderHighlights(runBoard(config, moment()));
  }
  const button = event.target.closest('[data-pin], [data-unpin-all]');
  if (!button) return;
  const kept = pins[button.dataset.kind];
  if (button.dataset.pin && !kept.delete(button.dataset.pin)) kept.add(button.dataset.pin);
  if (button.hasAttribute('data-unpin-all')) PIN_KINDS.forEach(kind => pins[kind].clear());
  remember(PINS_KEY, { fill: [...pins.fill], outline: [...pins.outline] });
  markPins(runBoard(config, moment()));
}

// Everything but the trains table, which is left alone while it's edited, so the cursor stays put.
// Each page draws the rules its own way, in renderLogic(rows).
function renderOutputs() {
  const rows = runBoard(config, moment());
  renderDataChoice();
  renderBoard(rows, runBoard(ORIGINAL, moment()));
  renderLogic(rows);
  renderHighlights(rows);
  return rows;
}

function render() {
  const rows = renderOutputs();
  renderInputs(rows);
  markPins(rows);
}

// Start: what both pages share. Each page calls this once it has declared renderLogic.
function startBoard() {
  config = remembered(STORAGE_KEY) ?? copy(ORIGINAL);
  data = DATA.find(preset => preset.id === remembered(DATA_KEY)) ?? DATA[0];
  edits = remembered(EDITS_KEY) ?? {};
  const savedPins = remembered(PINS_KEY);
  const pinned = kind => new Set(Array.isArray(savedPins?.[kind]) ? savedPins[kind] : []);
  pins = { fill: pinned('fill'), outline: pinned('outline') };

  document.querySelector('sb-shell').pages = PAGES;
  const highlightsPanel = document.getElementById('highlights-panel');
  document.getElementById('trains').addEventListener('change', onTrainField);
  document.getElementById('trains').addEventListener('click', onTrainAction);
  document.addEventListener('mouseover', onPoint);
  highlightsPanel.addEventListener('click', onPin);
  document.getElementById('data').addEventListener('change', event => useData(event.target.value));
  document.getElementById('reset').addEventListener('click', () => { config = copy(ORIGINAL); saveConfig(); render(); });
  setGlow(remembered(GLOW_KEY) === true);
  render();
  if (!highlightsPanel.floating) highlightsPanel.popOut({ left: innerWidth - 300, top: 140, width: 280, height: Math.min(560, innerHeight - 180) });
}
