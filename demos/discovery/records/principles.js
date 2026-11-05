// Principles: rules of thumb people choose by.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const PRINCIPLES = [
  { id: 'PRN-1', created: '2026-10-05T12:37', by: 'Agent', iteration: 1, tags: ['platform-changes', 'passengers'], status: 'followed',
    text: 'The station’s systems tell passengers, not staff running along the platform.',
    why: 'Staff reach too few people, and too late.',
    givesWayTo: 'Keeping people safe, when staff are the quickest way.',
    setIn: 'SRC-3.5' },
  { id: 'PRN-2', created: '2026-10-05T12:44', by: 'Agent', iteration: 1, tags: ['delays', 'no-estimate', 'platforms'], status: 'followed',
    text: 'The board says only what it knows: an expected time when there is one, Delayed or a dash when there isn’t.',
    why: 'Passengers act on what the board says, so a guess can cost them a train.',
    givesWayTo: 'Nothing yet.',
    setIn: 'SRC-3.1' },
  { id: 'PRN-3', created: '2026-10-05T12:51', by: 'Agent', iteration: 1, tags: ['cancellations', 'delays', 'message-line'], status: 'followed',
    text: 'When a train is cancelled or badly late, the board says why.',
    why: 'A reason helps passengers decide what to do next.',
    givesWayTo: 'A platform change, when there is only one line to say it on.',
    setIn: 'SRC-1.3' },
];
