// Rules: mandates and conditions, with the code that checks them against the model.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const RULES = [
  { id: 'RUL-1', created: '2026-10-05T14:01', by: 'Agent', iteration: 1, kind: 'MANDATE', title: 'Departed trains leave the board', foundedOn: ['CLM-1'],
    lines: [{ text: 'a departed train MUST NOT be shown on the board' }],
    check: M => {
      const board = new M.Board([]);
      return AFTERNOON.map(f => trainFor(M, f)).filter(t => t.departed && board.shows(t)).map(t => `the ${t.time.text} to ${t.destination}`);
    } },
  { id: 'RUL-2', created: '2026-10-05T14:08', by: 'Agent', iteration: 1, kind: 'CONDITIONAL', title: 'A changed platform is always told', foundedOn: ['CLM-5', 'DEC-1', 'OPN-1'],
    lines: [{ keyword: 'Given', text: 'a running train on the board' }, { keyword: 'If', text: 'its platform has changed' },
      { keyword: 'Then', text: 'its message line MUST say so', depth: 1 }],
    check: M => {
      const board = new M.Board([]);
      return AFTERNOON.map(f => trainFor(M, f))
        .filter(t => !t.departed && !t.cancelled && t.platformChanged() && !board.messageFor(t).startsWith('Platform changed'))
        .map(t => `the ${t.time.text} to ${t.destination}, whose message reads “${board.messageFor(t) || 'nothing'}”`);
    } },
];
