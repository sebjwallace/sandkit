// Actions: what a decision set going.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const ACTIONS = [
  { id: 'ACT-1', created: '2026-10-05T12:30', by: 'Agent', iteration: 1, tags: ['message-line', 'platform-changes'], from: 'DEC-1', text: 'Add the platform-change message rule on the board controller.', status: 'to do',
    owner: 'Station systems lead', due: '2026-10-16',
    doneWhen: 'The board’s message log shows “Platform changed to …” for the next train whose platform changes.',
    why: 'DEC-1 only helps once the board shows it.',
    done: 'SRC-9',
    sources: [
      'SRC-1.10',
      'SRC-9.1',
    ] },
  { id: 'ACT-2', created: '2026-11-04T10:24', by: 'Agent', iteration: 2, tags: ['announcements', 'platform-changes'], from: 'DEC-2', text: 'Set the PA to announce every platform change as soon as signalling confirms it.', status: 'to do',
    owner: 'Station systems lead', due: '2026-11-20',
    doneWhen: 'The PA log shows an announcement for every platform change over a week.',
    why: 'DEC-2 only helps if every change is announced, not just the ones staff notice.',
    sources: ['SRC-13.3'] },
];
