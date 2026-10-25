// Goals: where we’re trying to get to, as targets on metrics.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const GOALS = [
  { id: 'GOL-1', created: '2026-10-05T11:55', by: 'Agent', iteration: 1, text: 'No more than two missed trains a month from platform changes, by January.', status: 'off track',
    metric: 'MET-1', target: 'Two or fewer a month, by January.',
    setIn: ['SRC-8', 'Target: no more than two missed-train complaints a month from platform changes, by January.'] },
];
