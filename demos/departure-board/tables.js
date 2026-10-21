// The tables view: each part of the board's rules as a decision table, in a tab of its own.
// Conditions sit on the left of the divide, and on the right what the board shows, drawn as the board draws it.

function conditionCell(table, rule, fact) {
  const value = rule.when[fact];
  const before = originalRule(table, rule.id);
  const changed = before && before.when[fact] !== value;
  return `<td ${value ? `data-ref="${rule.id}.when.${fact}"` : ''}><button type="button" class="${classes('cell', value ? 'is-set' : 'is-any', changed && 'is-changed')}" data-action="cycle" data-fact="${fact}" title="${escapeHtml(FACTS[fact].note ?? '')}">${value ?? '–'}</button></td>`;
}

function outputCells(table, rule) {
  const before = originalRule(table, rule.id);
  const tone = rule.then.tone ?? 'plain';
  const options = TABLES[table].texts.map(text =>
    `<option value="${escapeHtml(text)}" ${text === rule.then.text ? 'selected' : ''}>${escapeHtml(text || '(blank)')}</option>`).join('');
  const shows = `<td data-ref="${rule.id}.then"><select data-action="text" class="${classes('board-text', `tone-${tone}`, rule.then.text === 'hide' && 'is-hidden-text', before && before.then.text !== rule.then.text && 'is-changed')}">${options}</select></td>`;
  if (!TABLES[table].toned) return shows;
  return shows + `<td data-ref="${rule.id}.then"><button type="button" class="${classes('cell board-text', `tone-${tone}`, before && before.then.tone !== tone && 'is-changed')}" data-action="tone" title="Click for the next tone">${tone}</button></td>`;
}

function ruleRow(table, rule, hits) {
  return `
    <tr data-rule="${rule.id}" class="${originalRule(table, rule.id) ? '' : 'is-changed'}">
      <td class="rule-id">${rule.id}</td>
      ${Object.keys(FACTS).map(fact => conditionCell(table, rule, fact)).join('')}
      <td class="divide"></td>
      ${outputCells(table, rule)}
      <td class="hits ${hits ? '' : 'is-dead'}" title="How many trains this rule decides">${hits ? `×${hits}` : 'never'}</td>
      <td class="rule-actions">
        <button type="button" data-action="up" title="Move up">↑</button>
        <button type="button" data-action="remove" title="Remove">✕</button>
      </td>
    </tr>`;
}

function rulesTable(table, rows) {
  const hitsOf = id => rows.filter(row => row.fired[table] === id).length;
  const toned = TABLES[table].toned;
  const factHeads = Object.values(FACTS).map(fact => `<th>${fact.label}</th>`).join('');
  return `
    <table>
      <tr class="groups"><th></th><th colspan="4">When</th><th class="divide"></th><th colspan="${toned ? 2 : 1}">Then</th><th></th><th></th></tr>
      <tr><th></th>${factHeads}<th class="divide"></th><th>Shows</th>${toned ? '<th>Tone</th>' : ''}<th></th><th></th></tr>
      ${config[table].map(rule => ruleRow(table, rule, hitsOf(rule.id))).join('')}
    </table>
    <button type="button" class="small-button add-rule" data-action="add">+ Rule</button>`;
}

function renderRules(rows) {
  document.querySelectorAll('.rules[data-table]').forEach(element => { element.innerHTML = rulesTable(element.dataset.table, rows); });
}

function onRules(event) {
  const target = event.target.closest('[data-action]');
  if (!target || (event.type === 'click' && target.tagName === 'SELECT')) return;
  const table = target.closest('[data-table]').dataset.table;
  const ruleId = target.closest('[data-rule]')?.dataset.rule;
  change(table, ruleId, target.dataset.action, target);
  saveConfig();
  render();
}

function startTables() {
  document.querySelector('.tables').addEventListener('click', onRules);
  document.querySelector('.tables').addEventListener('change', onRules);
}
