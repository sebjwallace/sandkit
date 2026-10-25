// Investigations: learning on purpose by finding what’s already there.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const INVESTIGATIONS = [
  { id: 'INV-1', created: '2026-10-05T09:49', by: 'Agent', iteration: 1, form: 'watching', who: 'Agent',
    text: 'See what the board actually shows, minute by minute.',
    how: 'Ask for a photo of the main board every minute through a Tuesday afternoon.' },
  { id: 'INV-2', created: '2026-10-05T09:56', by: 'Agent', iteration: 1, form: 'interview', who: 'Station team',
    text: 'Hear how the board behaves from someone who works under it.',
    how: 'Twenty minutes on platform 4 with the afternoon dispatcher, notes taken on the spot.' },
  { id: 'INV-3', created: '2026-10-05T10:03', by: 'Agent', iteration: 1, form: 'desk research', who: 'Agent',
    text: 'Find how the board is meant to work, and what the station has decided about it.',
    how: 'Gather the supplier’s manual, the complaints log and the station team’s minutes.' },
  { id: 'INV-4', created: '2026-10-05T10:10', by: 'Agent', iteration: 1, form: 'web search', who: 'Agent',
    text: 'Find what passengers say about the board.',
    how: 'Search the passenger forum and local commuter groups for posts about the board.' },
  { id: 'INV-5', created: '2026-10-05T10:17', by: 'Agent', iteration: 1, prompt: 'QST-2', form: 'watching', who: 'Duty manager',
    text: 'Find whether anything on the board changes as a train becomes due.',
    how: 'Watch the main board through a morning peak, noting what changes in each train’s last minutes.' },
  { id: 'INV-6', created: '2026-11-04T09:00', by: 'Agent', iteration: 2, prompt: 'PRD-2', form: 'desk research', who: 'Agent',
    text: 'Find how stations that already announce platform changes on the PA have fared.',
    how: 'Search rail industry reports, and other stations’ published complaint figures from before and after they began announcing changes.' },
];
