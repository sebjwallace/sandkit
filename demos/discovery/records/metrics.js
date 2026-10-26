// Metrics: quantities tracked over time.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const METRICS = [
  { id: 'MET-1', created: '2026-10-05T10:24', by: 'Agent', iteration: 1, name: 'Missed trains after a platform change', unit: 'passengers', every: 'month',
    counted: 'Complaints from passengers who missed a train after a platform change.',
    from: 'The customer services complaints log' },
  { id: 'MET-2', created: '2026-10-05T10:31', by: 'Agent', iteration: 1, name: 'Passengers who read the message line', unit: 'percent', every: 'survey',
    counted: 'The share of surveyed passengers who say they read the message line under each train before heading for it.',
    from: 'The passenger survey' },
];
