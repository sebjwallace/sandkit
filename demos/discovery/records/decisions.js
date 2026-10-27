// Decisions: the options weighed, the one chosen, what it rests on, and why.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const DECISIONS = [{
  id: 'DEC-1', created: '2026-10-05T11:48', by: 'Agent', iteration: 1, tags: ['platform-changes', 'message-line'],
  title: 'How should the board tell passengers about a platform change?',
  status: 'accepted',
  when: '2026-10-09',
  deciders: ['Station team'],
  options: [
    { id: 'a', title: 'Leave the board as it is', pros: ['No work'], cons: ['Twelve missed trains a month'] },
    { id: 'b', title: 'Add a message: “Platform changed to 9”', source: 'SRC-1', pros: ['A change of settings, no new hardware'], cons: ['Only works if people read the message line'] },
    { id: 'c', title: 'Flash the platform number', pros: ['Hard to miss'], cons: ['Needs a supplier upgrade'] },
  ],
  chosen: 'b',
  restsOn: ['GOL-1', 'CON-1', 'CON-2', 'CLM-5', 'ASM-1', 'QST-1'],
  decided: 'We add a message rule: when a train’s platform changes, the message line says “Platform changed to” and the new number.',
  reason: 'It answers QST-1 directly, needs only a change of settings, and can be in place this week, well before trains leave. Flashing would need a supplier upgrade, which CON-1 rules out.',
  sources: [
    'SRC-8.4',
    'SRC-1.8',
    'SRC-6.4',
  ],
}, {
  id: 'DEC-2', created: '2026-11-04T09:42', by: 'Agent', iteration: 2, tags: ['platform-changes', 'announcements', 'passengers'],
  title: 'How do platform changes reach the passengers who don’t read the message line?',
  status: 'accepted',
  when: '2026-11-06',
  deciders: ['Station team'],
  options: [
    { id: 'a', title: 'Keep the message alone', pros: ['No more work'], cons: ['Five missed trains a month'] },
    { id: 'b', title: 'Announce platform changes on the PA too', pros: ['Reaches people who never read the message line'], cons: ['Signalling has to confirm changes earlier'] },
    { id: 'c', title: 'Flash the platform number', pros: ['Hard to miss'], cons: ['Needs a supplier upgrade, which CON-1 rules out'] },
  ],
  chosen: 'b',
  restsOn: ['OUT-2', 'GOL-1', 'CON-1', 'CON-2', 'OBS-3'],
  decided: 'We announce every platform change on the PA as well as the board.',
  reason: 'Fewer than four in ten passengers read the message line (OBS-3), so the message alone can’t reach the goal. The PA reaches everyone on the concourse, and needs no change to the board.',
  sources: [
    'SRC-13.3',
    'SRC-11.1',
  ],
}];
