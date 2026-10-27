// Domain primitives proposed for the model, with what they’re founded on.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const PRIMITIVES = [
  { id: 'PRM-1', created: '2026-10-05T13:05', by: 'Agent', iteration: 1, tags: ['delays'], name: 'Delay', proposedBy: 'Agent', foundedOn: ['DEF-1', 'CLM-2', 'CLM-3'], purpose: 'How late a train is.' },
  { id: 'PRM-2', created: '2026-10-05T13:12', by: 'Agent', iteration: 1, tags: ['platforms'], name: 'Platform', proposedBy: 'Agent', foundedOn: ['DEF-4', 'CLM-4', 'CLM-5'], purpose: 'Which platform a train leaves from.' },
  { id: 'PRM-3', created: '2026-10-05T13:19', by: 'Agent', iteration: 1, tags: ['board-setup'], name: 'Clock time', proposedBy: 'Agent', foundedOn: ['DEF-5', 'CLM-1'], purpose: 'A time of day at the station.' },
];
