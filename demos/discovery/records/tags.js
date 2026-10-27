// Tags: every tag the cards carry, declared once with what it means, so one word means one thing.
// Tags say how a card is found, not what it says, so they can be added to earlier cards later.
// Read by the page and the discovery engine. See the domain discovery practice.
const TAGS = [
  { tag: 'departed-trains', means: 'When a train leaves the board once it has gone.' },
  { tag: 'delays', means: 'How a late train is shown: an expected time, On time, or Delayed, and what counts as a major delay.' },
  { tag: 'no-estimate', means: 'Trains the feed gives no expected time for, and what the board shows for them.' },
  { tag: 'cancellations', means: 'How a cancelled train is shown, and why.' },
  { tag: 'platforms', means: 'Which platform a train leaves from, and what the board shows before it’s confirmed.' },
  { tag: 'platform-changes', means: 'A train moved to another platform, and how passengers come to know.' },
  { tag: 'message-line', means: 'The line of text under each train on the board, and the rules that write it.' },
  { tag: 'announcements', means: 'What the station says over the PA, and how much notice it gets.' },
  { tag: 'due-trains', means: 'Whether anything on the board changes as a train becomes due to leave.' },
  { tag: 'passengers', means: 'What passengers read, miss, say or complain about.' },
  { tag: 'board-setup', means: 'How the board is laid out and configured, and what only the supplier can change.' },
];
