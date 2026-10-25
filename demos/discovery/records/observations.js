// Observations: readings taken straight from a source.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const OBSERVATIONS = [
  { id: 'OBS-1', created: '2026-10-05T10:45', by: 'Agent', iteration: 1, metric: 'MET-1', value: '12', of: 'Missed trains after a platform change', when: 'September 2026',
    at: ['SRC-7', 'Missed train after platform change,12'] },
  { id: 'OBS-2', created: '2026-11-04T09:21', by: 'Agent', iteration: 2, metric: 'MET-1', value: '5', of: 'Missed trains after a platform change', when: 'October 2026',
    at: ['SRC-10', 'Missed train after platform change,5'] },
  { id: 'OBS-3', created: '2026-11-04T09:28', by: 'Agent', iteration: 2, metric: 'MET-2', value: '38%', of: 'Passengers who read the message line under each train', when: 'October 2026',
    at: ['SRC-11', 'Message line under each train,38%'], tests: ['ASM-1', '−'], resultOf: 'EXP-1' },
  { id: 'OBS-4', created: '2026-11-04T09:35', by: 'Agent', iteration: 2, value: '3 of 34', of: 'Platform changes that would still be announced under five minutes before departure', when: 'October 2026, replayed',
    at: ['SRC-15', 'Announced under five minutes before departure,3'], tests: ['PRD-2', '−'], resultOf: 'EXP-3' },
];
