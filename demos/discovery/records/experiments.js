// Experiments: tests run on purpose, on the world or on the model.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const EXPERIMENTS = [
  { id: 'EXP-1', created: '2026-10-05T10:38', by: 'Agent', iteration: 1, from: 'DEC-1', form: 'survey', on: 'world', tests: ['ASM-1'],
    text: 'Ask two hundred passengers which parts of the board they read before heading for a train.',
    method: 'The survey team on the concourse over three days, at the morning peak, midday and the evening peak.',
    keeps: 'The board as it is, so the answers describe the board passengers know.',
    counts: 'The share of passengers who read each part of the board.',
    bearsOutIf: 'Most passengers say they read the message line.',
    setIn: 'SRC-8.2' },
  { id: 'EXP-2', created: '2026-11-04T09:07', by: 'Agent', iteration: 2, from: 'DEC-2', form: 'trial', on: 'world', tests: ['PRD-2'],
    text: 'Announce platform changes on the PA for one week, on platforms 3 and 9 only.',
    method: 'Every platform change for a train from platforms 3 or 9 is announced on the PA as soon as signalling confirms it.',
    keeps: 'The board’s message on every platform, and the other platforms without PA announcements.',
    counts: 'Passengers missing a train after a platform change, on platforms 3 and 9 against the rest.',
    bearsOutIf: 'Platforms 3 and 9 miss fewer trains than the rest, at a rate that would reach two or fewer a month station-wide.',
    setIn: 'SRC-13.1' },
  { id: 'EXP-3', created: '2026-11-04T09:14', by: 'Agent', iteration: 2, from: 'DEC-2', form: 'simulation', on: 'model', tests: ['PRD-2'],
    text: 'Replay October’s platform changes through the board’s model, with PA announcements and seven minutes’ notice from signalling.',
    method: 'The sandbox runs every platform change in October’s feed through the model, as DEC-2, AGR-1 and CON-3 would have it.',
    keeps: 'October’s trains and platform changes, exactly as they were.',
    counts: 'Changes announced at least five minutes before departure, as CON-2 asks.',
    bearsOutIf: 'Every change is announced in time.',
    setIn: 'SRC-13.2' },
];
