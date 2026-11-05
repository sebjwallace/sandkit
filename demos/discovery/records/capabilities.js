// Capabilities: what lets us move towards the goals; a constraint's opposite.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const CAPABILITIES = [
  { id: 'CAP-1', created: '2026-10-05T12:30', by: 'Agent', iteration: 1, tags: ['message-line', 'board-setup'], status: 'available',
    text: 'New message rules can be added to the board in its settings, and apply from the next refresh.',
    lets: 'The board can tell passengers something new without new hardware or a supplier upgrade.',
    limits: 'Only what a message rule can say: CON-1 keeps everything else fixed.',
    setIn: 'SRC-1.10' },
  { id: 'CAP-2', created: '2026-11-04T10:24', by: 'Agent', iteration: 2, tags: ['announcements', 'platform-changes'], status: 'available',
    text: 'The station can announce a platform change on the PA as well as the board.',
    lets: 'A change can reach the passengers who never read the message line.',
    limits: 'It takes time to announce, so it needs the change confirmed early: see CAP-3.',
    setIn: 'SRC-13.3' },
  { id: 'CAP-3', created: '2026-11-04T10:31', by: 'Agent', iteration: 2, tags: ['announcements', 'platform-changes'], from: 'AGR-1', status: 'available',
    text: 'Signalling control can confirm a platform change at least seven minutes before departure.',
    lets: 'The station has time to announce a change and still give passengers five minutes’ notice.',
    limits: 'Rests on AGR-1, which either side may ask to review.',
    setIn: 'SRC-14.1' },
];
