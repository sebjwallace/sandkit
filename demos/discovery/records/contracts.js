// Domain contracts: what the parties agree shapes the domain, at any one time. A contract names its
// definitions, goals, optimizations, constraints, capabilities and principles. Its goals,
// optimizations and constraints each run in order of priority.
// A party signs the whole contract, having read it: `signed` says when, and may be added after the
// record is written, since signing changes nothing it says. Amending a contract means writing a new
// one that supersedes it, which takes over once signed.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const SCOPE_OF_THE_BOARD = {
  in: 'What the departure board shows for each train, and how passengers come to know of a platform change.',
  out: 'Calling points, the passenger app, and how the board’s firmware works inside.',
};
const CONTRACTS = [
  { id: 'CTR-1', created: '2026-10-09T16:00', by: 'Agent', iteration: 1, tags: ['platform-changes', 'message-line'],
    title: 'The departure board at Ashford International',
    scope: SCOPE_OF_THE_BOARD,
    definitions: ['DEF-3', 'DEF-1', 'DEF-6', 'DEF-7', 'DEF-4', 'DEF-8', 'DEF-2'],
    goals: ['GOL-1'],
    optimizations: [],
    constraints: ['CON-1', 'CON-2'],
    capabilities: ['CAP-1'],
    principles: ['PRN-1', 'PRN-2', 'PRN-3'],
    parties: [{ name: 'Station team', signed: { when: '2026-10-09', iteration: 1 } }, { name: 'Platform dispatchers', signed: { when: '2026-10-09', iteration: 1 } }] },
  { id: 'CTR-2', created: '2026-11-06T16:00', by: 'Agent', iteration: 2, tags: ['platform-changes', 'announcements'], supersedes: 'CTR-1',
    title: 'The departure board at Ashford International',
    scope: SCOPE_OF_THE_BOARD,
    definitions: ['DEF-9', 'DEF-3', 'DEF-1', 'DEF-6', 'DEF-7', 'DEF-4', 'DEF-8', 'DEF-2'],
    goals: ['GOL-1'],
    optimizations: ['OPZ-1'],
    constraints: ['CON-1', 'CON-2', 'CON-3'],
    capabilities: ['CAP-1', 'CAP-2', 'CAP-3'],
    principles: ['PRN-1', 'PRN-2', 'PRN-3'],
    parties: [{ name: 'Station team', signed: { when: '2026-11-06', iteration: 2 } }, { name: 'Platform dispatchers', signed: { when: '2026-11-06', iteration: 2 } }, { name: 'Signalling control', signed: { when: '2026-11-06', iteration: 2 } }] },
];
