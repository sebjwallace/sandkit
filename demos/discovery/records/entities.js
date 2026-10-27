// Entities proposed for the model, with what they’re founded on.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const ENTITIES = [
  { id: 'ENT-1', created: '2026-10-05T12:44', by: 'Agent', iteration: 1, tags: ['delays', 'platforms'], name: 'Train', proposedBy: 'Agent', foundedOn: ['DEF-2', 'CLM-1', 'CLM-2', 'CLM-4', 'INV-3'],
    purpose: 'A service leaving the station: when, where to, from which platform, and how late.' },
  { id: 'ENT-2', created: '2026-10-05T12:51', by: 'Agent', iteration: 1, tags: ['board-setup', 'message-line'], name: 'Board', proposedBy: 'Agent', foundedOn: ['DEF-3', 'CLM-1', 'CLM-3', 'CON-1', 'QST-1'],
    purpose: 'The departure board: which trains it shows, and the line it shows for each.' },
  { id: 'ENT-3', created: '2026-10-05T12:58', by: 'Agent', iteration: 1, tags: ['platforms'], name: 'Platform', proposedBy: 'Agent', foundedOn: ['DEF-4', 'CLM-4', 'CLM-5'],
    purpose: 'A platform as a thing in its own right.',
    rejected: { in: 1, why: 'It has no state or behaviour of its own: every rule about platforms needs only its number. The Platform primitive (PRM-2) does the job with one less moving part.' } },
  { id: 'ENT-4', created: '2026-11-04T10:31', by: 'Agent', iteration: 2, tags: ['announcements', 'platform-changes'], name: 'Announcement', proposedBy: 'Agent', foundedOn: ['DEC-2', 'CON-2', 'CON-3'],
    purpose: 'A PA announcement of a platform change: for which train, and how long before it leaves.' },
];
