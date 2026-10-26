// Definitions: what words in the domain mean, as a source sets them.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const DEFINITIONS = [
  { id: 'DEF-1', created: '2026-10-05T11:06', by: 'Agent', iteration: 1, term: 'Delay', meaning: 'How late a train is, in whole minutes. Five minutes or more is a major delay; anything less is a minor one.',
    example: 'A train three minutes late has a minor delay; the board still shows its expected time (CLM-2).',
    setIn: 'SRC-1.4' },
  { id: 'DEF-2', created: '2026-10-05T11:13', by: 'Agent', iteration: 1, term: 'Train', meaning: 'A service scheduled to leave the station for a destination at a set time.',
    example: 'The 14:05 to Cambridge.',
    setIn: 'SRC-1.5' },
  { id: 'DEF-3', created: '2026-10-05T11:20', by: 'Agent', iteration: 1, term: 'Board', meaning: 'The main departure board: one line per train, in order of scheduled departure.',
    example: 'The board on the concourse, above the ticket gates.',
    setIn: 'SRC-1.6' },
  { id: 'DEF-4', created: '2026-10-05T11:27', by: 'Agent', iteration: 1, term: 'Platform', meaning: 'Where a train leaves from: one of the station’s platforms, numbered 1 to 12.',
    example: 'Platform 9, where the Gatwick Airport train moved from platform 3.',
    setIn: 'SRC-3.4' },
  { id: 'DEF-5', created: '2026-10-05T11:34', by: 'Agent', iteration: 1, term: 'Clock time', meaning: 'A time of day by the station clock, in hours and minutes on the 24-hour clock.',
    example: '14:05.',
    setIn: 'SRC-1.7' },
];
