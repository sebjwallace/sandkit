// Outcomes: what actually happened, measured against a goal or prediction.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const OUTCOMES = [
  { id: 'OUT-1', created: '2026-10-05T12:09', by: 'Agent', iteration: 1, tags: ['platform-changes', 'passengers'], result: 'failed', against: 'GOL-1', from: ['OBS-1', 'INF-1'],
    text: 'Passengers miss trains when a platform changes: twelve in September.',
    teaches: 'A platform change shown only in the platform column goes unseen. Passengers need telling some other way.',
    sources: [
      'SRC-7.1',
      'SRC-3.3',
    ] },
  { id: 'OUT-2', created: '2026-11-04T09:56', by: 'Agent', iteration: 2, tags: ['platform-changes', 'passengers'], result: 'partly', against: 'GOL-1', from: ['OBS-2'],
    text: 'Missed trains after a platform change fell from twelve to five in October.',
    teaches: 'The message helps, but it doesn’t reach everyone: more than half the misses went, but not enough to meet the goal.',
    sources: ['SRC-10.1'] },
  { id: 'OUT-3', created: '2026-11-04T10:03', by: 'Agent', iteration: 2, tags: ['platform-changes', 'passengers'], result: 'worked', against: 'PRD-1', from: ['OBS-2'],
    text: 'Missed trains after a platform change fell to five in October: the handful DEC-1 predicted.',
    teaches: 'The message did what was predicted of it. The prediction was too modest for the goal, not wrong.',
    sources: ['SRC-10.1'] },
];
