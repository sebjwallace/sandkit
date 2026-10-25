// Constraints: what rules options out, and where it comes from.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const CONSTRAINTS = [
  { id: 'CON-1', created: '2026-10-05T12:16', by: 'Agent', iteration: 1, text: 'The board’s logic can only change through its message rules; anything else needs a supplier upgrade.', firmness: 'hard', status: 'holds',
    rulesOut: 'Flashing the platform number, or changing how the platform column shows a change.',
    comesFrom: { cause: 'a past decision', text: 'The supplier’s design: everything but the message rules was fixed in the controller’s firmware when the board was bought.' },
    protects: 'The supplier’s goal of a board it can support, so every deeper change goes through an upgrade it has tested.',
    setIn: ['SRC-1', 'Display logic other than message rules is fixed in firmware, and changes to it need a supplier upgrade.'] },
  { id: 'CON-2', created: '2026-10-05T12:23', by: 'Agent', iteration: 1, text: 'A platform change must reach passengers at least five minutes before departure.', firmness: 'soft', status: 'holds',
    rulesOut: 'Relying on staff calling out the change along the platform, which often comes too late.',
    comesFrom: { cause: 'values', text: 'The station’s accessibility policy. The station team set it, and could change it.' },
    protects: 'Passengers with reduced mobility, who need time to reach a new platform.',
    setIn: ['SRC-8', 'As station policy, platform changes must reach passengers at least five minutes before departure, so those with reduced mobility can reach the new platform.'] },
  { id: 'CON-3', created: '2026-11-04T10:10', by: 'Agent', iteration: 2, from: 'AGR-1', text: 'Signalling must confirm a platform change at least seven minutes before departure.', firmness: 'soft', status: 'holds',
    rulesOut: 'Late platform changes, made with no time left to announce them.',
    comesFrom: { cause: 'an agreement', text: 'AGR-1, the station’s agreement with signalling control.' },
    protects: 'CON-2’s five minutes’ notice for passengers: announcing takes about two, so signalling must confirm seven ahead.',
    setIn: ['SRC-14', 'Signalling control will confirm every platform change at Ashford International at least seven minutes before the train\'s departure.'] },
];
