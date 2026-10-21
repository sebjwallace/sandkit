// The graph view: the rules as a flow from a train's details, through facts and rules, to what the board shows.
// Conditions are wires from a fact's value to a rule, made by dragging. What's highlighted shows as a trace through it.

// The details facts are worked out from (FEEDS, in the model), drawn but not wired by hand.
const DETAILS = ['time', 'delay', 'platform', 'planned', 'confirmed', 'cancelled', 'departed', 'clock'];

let drag = null;
let graph;

// The columns.

function detailsColumn() {
  const nodes = DETAILS.map(detail => `
    <div class="node detail" data-detail="${detail}" data-part="detail:${detail}">
      <span>${detail === 'clock' ? 'station clock' : detail}</span>${detail === 'clock' ? `<b>${data.now}</b>` : ''}
    </div>`).join('');
  return `<div class="column" style="grid-column: 1; grid-row: 2 / span ${Object.keys(TABLES).length}">${nodes}</div>`;
}

function factsColumn() {
  const nodes = Object.entries(FACTS).map(([fact, { label, values, note }]) => `
    <div class="node fact-node" data-fact-node="${fact}" title="${escapeHtml(note ?? '')}">
      <div class="node-title">${label}</div>
      ${values.map(value => `
        <div class="port" data-fact="${fact}" data-value="${value}" data-part="port:${fact}=${value}" title="Drag onto a rule to make it a condition">${value}</div>`).join('')}
    </div>`).join('');
  return `<div class="column" style="grid-column: 2; grid-row: 2 / span ${Object.keys(TABLES).length}">${nodes}</div>`;
}

function conditionPill(table, rule, fact) {
  const before = originalRule(table, rule.id);
  const changed = before && before.when[fact] !== rule.when[fact];
  return `<button type="button" class="${classes('condition', changed && 'is-changed')}" data-ref="${rule.id}.when.${fact}" data-action="unwire" data-fact="${fact}" title="Remove this condition">${FACTS[fact].label}: ${rule.when[fact]} ✕</button>`;
}

function ruleNode(table, rule, hits) {
  const before = originalRule(table, rule.id);
  const tone = rule.then.tone ?? 'plain';
  const facts = Object.keys(rule.when);
  const options = TABLES[table].texts.map(text =>
    `<option value="${escapeHtml(text)}" ${text === rule.then.text ? 'selected' : ''}>${escapeHtml(text || '(blank)')}</option>`).join('');
  const toneButton = TABLES[table].toned
    ? `<button type="button" class="${classes('cell board-text tone-button', `tone-${tone}`, before && before.then.tone !== tone && 'is-changed')}" data-action="tone" title="Click for the next tone">${tone}</button>` : '';
  return `
    <div class="${classes('node rule-node', !before && 'is-changed')}" data-rule="${rule.id}" data-table="${table}">
      <div class="rule-line">
        <span class="rule-id">${rule.id}</span>
        <span class="conditions">${facts.length ? facts.map(fact => conditionPill(table, rule, fact)).join('') : '<span class="otherwise">otherwise</span>'}</span>
        <span class="hits ${hits ? '' : 'is-dead'}" title="How many trains this rule decides">${hits ? `×${hits}` : 'never'}</span>
        <span class="rule-actions">
          <button type="button" data-action="up" title="Move up">↑</button>
          <button type="button" data-action="remove" title="Remove">✕</button>
        </span>
      </div>
      <div class="rule-line" data-ref="${rule.id}.then">
        <span class="arrow">→</span>
        <select data-action="text" class="${classes('board-text', `tone-${tone}`, rule.then.text === 'hide' && 'is-hidden-text', before && before.then.text !== rule.then.text && 'is-changed')}">${options}</select>
        ${toneButton}
      </div>
    </div>`;
}

function ruleGroups(rows) {
  const hitsOf = (table, id) => rows.filter(candidate => candidate.fired[table] === id).length;
  return Object.keys(TABLES).map((table, i) => `
    <div class="group" data-table="${table}" style="grid-column: 3; grid-row: ${i + 2}">
      <div class="group-title">${TABLES[table].label}</div>
      ${config[table].map(rule => ruleNode(table, rule, hitsOf(table, rule.id))).join('')}
      <button type="button" class="small-button add-rule" data-action="add">+ Rule</button>
    </div>
    <div class="node output" data-output="${table}" data-part="output:${table}" style="grid-column: 4; grid-row: ${i + 2}">
      <div class="node-title">${TABLES[table].label}</div>
    </div>`).join('');
}

function renderGraph(rows) {
  const headings = ['The train', 'Facts', 'Rules · first match from the top', 'The board shows']
    .map((heading, i) => `<div class="column-heading" style="grid-column: ${i + 1}; grid-row: 1">${heading}</div>`).join('');
  graph.innerHTML = `<svg class="wires" id="wires"></svg>${headings}${detailsColumn()}${factsColumn()}${ruleGroups(rows)}`;
  drawWires();
}

// The wires, measured from where the nodes landed, so the layout stays plain HTML.

function anchor(element, side) {
  const box = element.getBoundingClientRect();
  const frame = graph.getBoundingClientRect();
  return { x: (side === 'right' ? box.right : box.left) - frame.left, y: box.top + box.height / 2 - frame.top };
}

function wire(from, to, className, part = '') {
  const middle = (from.x + to.x) / 2;
  return `<path class="${className}" data-part="${part}" d="M ${from.x} ${from.y} C ${middle} ${from.y}, ${middle} ${to.y}, ${to.x} ${to.y}" />`;
}

function drawWires() {
  const svg = document.getElementById('wires');
  if (!svg || !graph.offsetParent) return;   // a hidden tab has nothing to measure
  const node = selector => graph.querySelector(selector);
  const wires = [];
  for (const [fact, details] of Object.entries(FEEDS)) {
    for (const detail of details) {
      wires.push(wire(anchor(node(`[data-detail="${detail}"]`), 'right'), anchor(node(`[data-fact-node="${fact}"] .node-title`), 'left'), 'wire feed', `feed:${detail}:${fact}`));
    }
  }
  for (const table of Object.keys(TABLES)) {
    for (const rule of config[table]) {
      const ruleElement = node(`.rule-node[data-rule="${rule.id}"]`);
      for (const [fact, value] of Object.entries(rule.when)) {
        wires.push(wire(anchor(node(`[data-fact="${fact}"][data-value="${value}"]`), 'right'), anchor(ruleElement, 'left'), 'wire condition', `wire:${rule.id}:${fact}`));
      }
      wires.push(wire(anchor(ruleElement, 'right'), anchor(node(`[data-output="${table}"]`), 'left'), 'wire result', `result:${rule.id}`));
    }
  }
  svg.innerHTML = wires.join('') + (drag ? wire(drag.from, drag.to, 'wire is-dragging') : '');
}

// The graph's own marks for what a trace lights.
function partsOf(trace) {
  return [
    ...trace.fields.map(field => `detail:${field}`),
    ...trace.feeds.map(feed => `feed:${feed}`),
    ...trace.facts.map(fact => `port:${fact}`),
    ...trace.conditions.map(condition => `wire:${condition}`),
    ...trace.results.map(rule => `result:${rule}`),
    ...trace.outputs.map(table => `output:${table}`),
  ];
}

// Changing the rules: the same changes as the tables, plus wiring and unwiring conditions.

function onGraph(event) {
  const target = event.target.closest('[data-action]');
  if (!target || (event.type === 'click' && target.tagName === 'SELECT')) return;
  const table = target.closest('[data-table]').dataset.table;
  const ruleId = target.closest('[data-rule]')?.dataset.rule;
  if (target.dataset.action === 'unwire') delete config[table].find(rule => rule.id === ruleId).when[target.dataset.fact];
  else change(table, ruleId, target.dataset.action, target);
  saveConfig();
  render();
}

function startWire(event) {
  const port = event.target.closest('.port');
  if (!port) return;
  event.preventDefault();
  const from = anchor(port, 'right');
  drag = { fact: port.dataset.fact, value: port.dataset.value, from, to: from };
}

function moveWire(event) {
  if (!drag) return;
  const frame = graph.getBoundingClientRect();
  drag.to = { x: event.clientX - frame.left, y: event.clientY - frame.top };
  document.querySelectorAll('.rule-node.is-target').forEach(element => element.classList.remove('is-target'));
  document.elementFromPoint(event.clientX, event.clientY)?.closest('.rule-node')?.classList.add('is-target');
  drawWires();
}

// Dropping on a rule makes the fact's value one of its conditions, replacing any other value of the same fact.
function endWire(event) {
  if (!drag) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.rule-node');
  const { fact, value } = drag;
  drag = null;
  if (target) {
    config[target.dataset.table].find(rule => rule.id === target.dataset.rule).when[fact] = value;
    saveConfig();
  }
  render();
}

function startGraph() {
  graph = document.getElementById('graph');
  graph.addEventListener('click', onGraph);
  graph.addEventListener('change', onGraph);
  graph.addEventListener('pointerdown', startWire);
  document.addEventListener('pointermove', moveWire);
  document.addEventListener('pointerup', endWire);
  addEventListener('resize', () => renderOutputs());
}
