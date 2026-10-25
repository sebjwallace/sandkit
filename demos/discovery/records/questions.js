// Questions: what’s still open, raised in a source, and the passages that answer it.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const QUESTIONS = [
  { id: 'QST-1', created: '2026-10-05T09:35', by: 'Agent', iteration: 1, text: 'Why does a changed platform get no message?',
    answer: 'Because no rule covers it. The board has message rules for cancellations and delays only; a new platform shows in the platform column and nowhere else.',
    raisedBy: ['SRC-3', 'Platform changes are the worst. The number changes and nothing else does, so half of them miss it.'],
    answers: {
      'SRC-1': 'Messages: cancellation, with reason; delay, with reason. Further message rules may be added in configuration.',
      'SRC-6': 'None of the board’s message rules mentions the platform, so a change shows only in the platform column.',
    } },
  { id: 'QST-2', created: '2026-10-05T09:42', by: 'Agent', iteration: 1, text: 'Does the board change anything as a train becomes due?',
    answer: 'No. Nothing on a train’s line changes as it becomes due; the board never says Boarding.',
    raisedBy: ['SRC-8', 'The team asks whether the board ever says Boarding, or marks a train about to leave.'],
    answers: {
      'SRC-12': 'Between 07:30 and 09:00 the board never said Boarding; nothing on a train’s line changed as it became due.',
    } },
];
