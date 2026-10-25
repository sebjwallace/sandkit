// Claims: what a source’s passages were taken to say about how things are, for and against.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const CLAIMS = [
  { id: 'CLM-1', created: '2026-10-05T09:00', by: 'Agent', iteration: 1, text: 'A train is taken off the board as soon as it has departed.', summary: 'The stills show it, and the agent’s reading of them agrees. The manual says the same, though a manual says how the board should work, not how it does. Well backed.', assertions: {
    'SRC-2': ['+', '13:58 Hastings: on the board at 13:57, gone at 13:59, the minute the feed marked it departed.'],
    'SRC-6': ['+', 'Every departed train left the board within a minute of the feed marking it departed. None stayed on.'],
    'SRC-1': ['+', 'Departed services are removed from display.'],
  } },
  { id: 'CLM-2', created: '2026-10-05T09:07', by: 'Agent', iteration: 1, text: 'Any delay, even a minute, shows an expected time instead of On time.', summary: 'The stills and the agent’s reading agree. The manual says delays under five minutes show On time, but it describes how the board was meant to work; the board itself does otherwise.', assertions: {
    'SRC-2': ['+', '14:05 Cambridge, three minutes late in the feed: shown as Exp 14:08.'],
    'SRC-6': ['+', 'All four delayed trains showed an expected time, whether one minute late or twelve.'],
    'SRC-1': ['−', 'Delays of under five minutes are shown as On time.'],
  } },
  { id: 'CLM-3', created: '2026-10-05T09:14', by: 'Agent', iteration: 1, text: 'When a train has no estimate, the board shows it as On time.', summary: 'Only the forum post says so, and the newsletter repeats it. The stills and the dispatcher both say such a train shows as Delayed. This leans false.', assertions: {
    'SRC-5': ['+', 'No estimate on the app, and the board said On time right up until it vanished. Never came.'],
    'SRC-4': ['+', 'One commuter reports the board showing On time for a train that had no estimate at all.'],
    'SRC-2': ['−', '14:12 Dover Priory, no estimate in the feed: shown as Delayed, platform –.'],
    'SRC-3': ['−', 'If there’s no estimate it says Delayed. I’ve never seen it say On time for one of those.'],
  } },
  { id: 'CLM-4', created: '2026-10-05T09:21', by: 'Agent', iteration: 1, text: 'Until a platform is confirmed, the board shows a dash.', summary: 'The stills show it, and the dispatcher sees it every day. Well backed.', assertions: {
    'SRC-2': ['+', '14:20 Bedford, platform unconfirmed in the feed: platform column shows –.'],
    'SRC-3': ['+', 'Until signalling confirms a platform we get a dash, and people crowd the concourse waiting for it.'],
  } },
  { id: 'CLM-5', created: '2026-10-05T09:28', by: 'Agent', iteration: 1, informs: ['QST-1'], text: 'A changed platform shows only in the platform column, with no message.', summary: 'The agent’s reading of the stills. Nothing disputes it, but nothing else checks it either.', assertions: {
    'SRC-6': ['+', 'Gatwick Airport moved from platform 3 to 9: the platform column showed 9, and the message line stayed blank.'],
  } },
];
