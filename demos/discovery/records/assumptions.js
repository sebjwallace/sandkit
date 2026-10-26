// Assumptions: what’s taken as true without evidence, so it can be tested.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const ASSUMPTIONS = [
  { id: 'ASM-1', created: '2026-10-05T10:52', by: 'Agent', iteration: 1, heldBy: 'Station team', text: 'Passengers read the message line under each train.',
    testBy: 'Ask passengers which parts of the board they read before heading for a train.',
    ifWrong: 'A message alone won’t reach most passengers, so DEC-1 can’t bring the goal much closer.',
    setIn: 'SRC-8.3' },
];
