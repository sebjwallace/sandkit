// Claims: what a source’s passages were taken to say about how things are, for and against.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const CLAIMS = [
  { id: 'CLM-1', created: '2026-10-05T09:00', by: 'Agent', iteration: 1, text: 'A train is taken off the board as soon as it has departed.', summary: 'The stills show it, and the agent’s reading of them agrees. The manual says the same, though a manual says how the board should work, not how it does. Well backed.', assertions: {
    'SRC-2.1': '+',
    'SRC-6.1': '+',
    'SRC-1.1': '+',
  } },
  { id: 'CLM-2', created: '2026-10-05T09:07', by: 'Agent', iteration: 1, text: 'Any delay, even a minute, shows an expected time instead of On time.', summary: 'The stills and the agent’s reading agree. The manual says delays under five minutes show On time, but it describes how the board was meant to work; the board itself does otherwise.', assertions: {
    'SRC-2.2': '+',
    'SRC-6.2': '+',
    'SRC-1.2': '−',
  } },
  { id: 'CLM-3', created: '2026-10-05T09:14', by: 'Agent', iteration: 1, text: 'When a train has no estimate, the board shows it as On time.', summary: 'Only the forum post says so, and the newsletter repeats it. The stills and the dispatcher both say such a train shows as Delayed. This leans false.', assertions: {
    'SRC-5.1': '+',
    'SRC-4.1': '+',
    'SRC-2.3': '−',
    'SRC-3.1': '−',
  } },
  { id: 'CLM-4', created: '2026-10-05T09:21', by: 'Agent', iteration: 1, text: 'Until a platform is confirmed, the board shows a dash.', summary: 'The stills show it, and the dispatcher sees it every day. Well backed.', assertions: {
    'SRC-2.4': '+',
    'SRC-3.2': '+',
  } },
  { id: 'CLM-5', created: '2026-10-05T09:28', by: 'Agent', iteration: 1, informs: ['QST-1'], text: 'A changed platform shows only in the platform column, with no message.', summary: 'The agent’s reading of the stills. Nothing disputes it, but nothing else checks it either.', assertions: {
    'SRC-6.3': '+',
  } },
];
