// Optimizations: measures always pushed one way, never done.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const OPTIMIZATIONS = [
  { id: 'OPZ-1', created: '2026-11-04T10:45', by: 'Agent', iteration: 2, tags: ['platform-changes', 'passengers'], status: 'improving',
    text: 'Keep bringing down missed trains after a platform change, even once the goal is met.',
    metric: 'MET-1', direction: 'down',
    weighedAgainst: 'How much is asked of signalling control and the station’s staff.',
    setIn: 'SRC-10.1' },
];
