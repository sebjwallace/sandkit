// Feedback: what someone who knows the domain said of the model, on one version, and whether it
// works or is wrong. Records: written once, never edited, only superseded; each says when, by whom
// and in which iteration it was made. Read by the page and the discovery engine. See the domain
// discovery practice.
const FEEDBACK = [
  { id: 'FB-1', created: '2026-11-04T09:40', by: 'Agent', iteration: 2, who: 'Platform dispatcher', about: ['SCN-5', 'ENT-2'], version: 1, verdict: 'wrong',
    text: 'The Ely train moved platform, and the board only says it’s late.', said: 'SRC-16.1', meta: [{ label: 'At', text: '14:22 on the prototype’s afternoon' }] },
  { id: 'FB-2', created: '2026-11-04T09:44', by: 'Agent', iteration: 2, who: 'Platform dispatcher', about: 'ENT-2', version: 1, verdict: 'works',
    text: 'Cancellations read the way the PA says them.', said: 'SRC-16.2' },
  { id: 'FB-3', created: '2026-11-04T09:47', by: 'Agent', iteration: 2, who: 'Platform dispatcher', about: 'prototype', version: 1, verdict: 'wrong',
    text: 'The board should show calling points.', said: 'SRC-16.3',
    declined: 'Calling points are outside this sandbox, which is about what the board decides to show in its columns and message line.' },
];
