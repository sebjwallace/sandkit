// Questions: what’s still open, raised in a source, and the passages that answer it.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const QUESTIONS = [
  { id: 'QST-1', created: '2026-10-05T09:35', by: 'Agent', iteration: 1, tags: ['platform-changes', 'message-line'], text: 'Why does a changed platform get no message?',
    answer: 'Because no rule covers it. The board has message rules for cancellations and delays only; a new platform shows in the platform column and nowhere else.',
    raisedBy: 'SRC-3.3',
    answers: ['SRC-1.3', 'SRC-6.4'] },
  { id: 'QST-2', created: '2026-10-05T09:42', by: 'Agent', iteration: 1, tags: ['due-trains'], text: 'Does the board change anything as a train becomes due?',
    answer: 'No. Nothing on a train’s line changes as it becomes due; the board never says Boarding.',
    raisedBy: 'SRC-8.1',
    answers: ['SRC-12.1'] },
];
