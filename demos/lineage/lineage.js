// The departure board's lineage: small runnable versions of its model, each one idea richer than its parent.
// A version is written out in full: the facts it knows about a train, its rules, its parent, and what caused it.
// Versions are never changed; a new idea is a new version. Those set aside stay, as dead ends.

const STATION = 'Ashford International';
const NOW = '14:00';

// A quiet afternoon, copied from the departure board, with one train added. delay is in minutes, null when there's no estimate.
// Later versions read two more details, given only where they're true: bus (a replacement bus runs) and short (fewer coaches).
const TRAINS = [
  { id: 'T1', time: '14:02', destination: 'Brighton', delay: 0, platform: '4', planned: '4', confirmed: true, cancelled: false, departed: false, reason: '' },
  { id: 'T2', time: '14:05', destination: 'Cambridge', delay: 3, platform: '2', planned: '2', confirmed: true, cancelled: false, departed: false, reason: 'a late-running freight train', short: true },
  { id: 'T3', time: '14:08', destination: 'Oxford', delay: 12, platform: '7', planned: '7', confirmed: true, cancelled: false, departed: false, reason: 'a signal fault' },
  { id: 'T4', time: '14:10', destination: 'Reading', delay: 0, platform: '5', planned: '5', confirmed: true, cancelled: true, departed: false, reason: 'a shortage of train crew' },
  { id: 'T5', time: '14:12', destination: 'Dover Priory', delay: null, platform: '', planned: '3', confirmed: false, cancelled: false, departed: false, reason: 'a broken-down train' },
  { id: 'T6', time: '14:15', destination: 'Gatwick Airport', delay: 0, platform: '9', planned: '3', confirmed: true, cancelled: false, departed: false, reason: '' },
  { id: 'T7', time: '14:20', destination: 'Bedford', delay: 0, platform: '', planned: '8', confirmed: false, cancelled: false, departed: false, reason: '', short: true },
  { id: 'T8', time: '13:58', destination: 'Hastings', delay: 0, platform: '1', planned: '1', confirmed: true, cancelled: false, departed: true, reason: '' },
  { id: 'T9', time: '14:25', destination: 'Ely', delay: 6, platform: '11', planned: '10', confirmed: true, cancelled: false, departed: false, reason: 'an earlier fault' },
  { id: 'T10', time: '13:55', destination: 'Luton', delay: 7, platform: '6', planned: '6', confirmed: true, cancelled: false, departed: false, reason: 'congestion' },
  { id: 'T11', time: '14:18', destination: 'Portsmouth Harbour', delay: 0, platform: '', planned: '12', confirmed: false, cancelled: true, departed: false, reason: 'flooding', bus: true },
  { id: 'T12', time: '14:06', destination: 'Canterbury West', delay: 35, platform: '8', planned: '8', confirmed: true, cancelled: false, departed: false, reason: 'a points failure' },
];

// How each fact is read from a train. Versions share these, since the train's details never change.
const runningOrCancelled = train => (train.cancelled ? 'cancelled' : 'running');
const runningCancelledOrDeparted = train => (train.departed && !train.cancelled ? 'departed' : runningOrCancelled(train));
const onTimeOrLate = train => (train.delay === 0 ? 'none' : 'late');
const howLate = train => {
  if (train.delay === null) return 'unknown';
  if (train.delay === 0) return 'none';
  return train.delay < 5 ? 'minor' : 'major';
};
const platformSettled = train => (train.confirmed ? 'confirmed' : 'unconfirmed');
const withBus = train => (runningCancelledOrDeparted(train) === 'cancelled' && train.bus ? 'replaced' : runningCancelledOrDeparted(train));
const howLateWithSevere = train => (train.delay >= 30 ? 'severe' : howLate(train));
const platformChanged = train => (train.confirmed && train.platform !== train.planned ? 'changed' : platformSettled(train));
const waitOf = train => expectedAt(train) - minutes(NOW);
const howSoon = train => {
  if (waitOf(train) <= 2) return 'now';
  return waitOf(train) <= 10 ? 'soon' : 'later';
};
const howSoonWithClosing = train => (waitOf(train) <= 0 ? 'closing' : howSoon(train));

const STATE = { values: ['running', 'cancelled'], of: runningOrCancelled };
const LATE = { values: ['none', 'late'], of: onTimeOrLate };
const DELAY = { values: ['none', 'minor', 'major', 'unknown'], of: howLate, note: 'minor: 1–4 min · major: 5 min or more · unknown: no estimate' };
const PLATFORM = { values: ['confirmed', 'unconfirmed'], of: platformSettled };
const STATE3 = { values: ['running', 'cancelled', 'departed'], of: runningCancelledOrDeparted };
const STATE4 = { values: ['running', 'cancelled', 'departed', 'replaced'], of: withBus, note: 'replaced: cancelled, with a bus instead' };
const DELAY5 = { values: ['none', 'minor', 'major', 'severe', 'unknown'], of: howLateWithSevere, note: 'major: 5–29 min · severe: 30 min or more' };
const PLATFORM3 = { values: ['confirmed', 'changed', 'unconfirmed'], of: platformChanged, note: 'changed: not the planned platform' };
const DUE = { values: ['now', 'soon', 'later'], of: howSoon, note: 'now: within 2 min · soon: within 10 min' };
const DUE4 = { values: ['closing', 'now', 'soon', 'later'], of: howSoonWithClosing, note: 'closing: at or past its expected time' };
const BUS = { values: ['no', 'yes'], of: train => (train.bus ? 'yes' : 'no') };
const LENGTH = { values: ['full', 'short'], of: train => (train.short ? 'short' : 'full') };

// Rules are read top to bottom, and the first whose conditions all hold applies. A condition left out matches anything.
const SETTLED_PLATFORM = [
  { when: { state: 'cancelled' }, then: { text: '' } },
  { when: { platform: 'unconfirmed' }, then: { text: '–' } },
  { when: {}, then: { text: '{platform}' } },
];

const LATE_EXPECTED = [
  { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
  { when: { delay: 'late' }, then: { text: 'Exp {expected}', tone: 'warn' } },
  { when: {}, then: { text: 'On time' } },
];

const LATE_NOTE = [
  { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
  { when: { delay: 'late' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
  { when: {}, then: { text: '' } },
];

const SPLIT_EXPECTED = [
  { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
  { when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
  { when: { delay: 'major' }, then: { text: 'Exp {expected}', tone: 'warn' } },
  { when: { delay: 'minor' }, then: { text: 'Exp {expected}', tone: 'warn' } },
  { when: {}, then: { text: 'On time' } },
];

const HIDE_DEPARTED = [
  { when: { state: 'departed' }, then: { text: 'hide' } },
  { when: {}, then: { text: 'show' } },
];

const SPLIT_NOTE = [
  { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
  { when: { delay: 'unknown' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
  { when: { delay: 'major' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
  { when: {}, then: { text: '' } },
];

const VERSIONS = [
  {
    id: 'V1', parent: null, name: 'Trains',
    cause: 'The simplest board there is: trains go to places at times, and the board lists them.',
    facts: {},
    rules: {},
  },
  {
    id: 'V2', parent: 'V1', name: 'Cancelled',
    cause: 'Trains get cancelled, and anyone waiting for one needs to know before anything else. Reading and Portsmouth Harbour are cancelled this afternoon.',
    facts: { state: STATE },
    rules: {
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: {}, then: { text: 'On time' } },
      ],
      note: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
        { when: {}, then: { text: '' } },
      ],
    },
  },
  {
    id: 'V3', parent: 'V2', name: 'Late',
    cause: 'Trains run late. Passengers plan around when a train will actually leave, so the board shows an expected time, and says why.',
    facts: { state: STATE, delay: LATE },
    rules: { expected: LATE_EXPECTED, note: LATE_NOTE },
  },
  {
    id: 'V3b', parent: 'V2', name: 'Just "Delayed"', setAside: true,
    cause: 'A rival to V3: estimates are often wrong, so show only "Delayed". Set aside, because a passenger with a connection to make needs a time, even an uncertain one.',
    facts: { state: STATE, delay: LATE },
    rules: {
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: { delay: 'late' }, then: { text: 'Delayed', tone: 'warn' } },
        { when: {}, then: { text: 'On time' } },
      ],
      note: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
        { when: { delay: 'late' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: {}, then: { text: '' } },
      ],
    },
  },
  {
    id: 'V4', parent: 'V3', name: 'Platforms',
    cause: "Platforms aren't settled until shortly before departure. Showing the planned one sends people to the wrong place, so the board shows a dash until it's confirmed.",
    facts: { state: STATE, delay: LATE, platform: PLATFORM },
    rules: {
      platform: SETTLED_PLATFORM,
      expected: LATE_EXPECTED,
      note: LATE_NOTE,
    },
  },
  {
    id: 'V5', parent: 'V4', name: 'How late',
    cause: '"Late" hid three different cases. Dover Priory has no estimate at all, yet V4 showed its own scheduled time as expected; and a train three minutes late needs no apology. Late splits into minor, major and unknown.',
    facts: { state: STATE, delay: DELAY, platform: PLATFORM },
    rules: { platform: SETTLED_PLATFORM, expected: SPLIT_EXPECTED, note: SPLIT_NOTE },
  },
  {
    id: 'V6', parent: 'V5', name: 'Departed',
    cause: 'Hastings left at 13:58, but still sat on the board as if it were waiting. Departed trains leave the board.',
    facts: { state: STATE3, delay: DELAY, platform: PLATFORM },
    rules: {
      platform: SETTLED_PLATFORM,
      expected: SPLIT_EXPECTED,
      note: SPLIT_NOTE,
      show: HIDE_DEPARTED,
    },
  },
  {
    id: 'V7', parent: 'V6', name: 'Boarding',
    cause: 'Brighton leaves in two minutes and the board still says "On time", as if there were time to spare. Trains due now, at a settled platform, say Boarding. Luton is seven minutes late and boarding too, so Boarding has to come before the delay rules.',
    facts: { state: STATE3, delay: DELAY, platform: PLATFORM, due: DUE },
    rules: {
      platform: SETTLED_PLATFORM,
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
        { when: { due: 'now', platform: 'confirmed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { delay: 'major' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: { delay: 'minor' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: {}, then: { text: 'On time' } },
      ],
      note: SPLIT_NOTE,
      show: HIDE_DEPARTED,
    },
  },
  {
    id: 'V7b', parent: 'V6', name: 'Boarding note', setAside: true,
    cause: 'A rival to V7: keep the expected column as it was, and say "Now boarding" in the message line. Set aside, because passengers scan the expected column, and the message was already taken by delay reasons.',
    facts: { state: STATE3, delay: DELAY, platform: PLATFORM, due: DUE },
    rules: {
      platform: SETTLED_PLATFORM,
      expected: SPLIT_EXPECTED,
      note: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
        { when: { due: 'now', platform: 'confirmed' }, then: { text: 'Now boarding', tone: 'flash' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: { delay: 'major' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: {}, then: { text: '' } },
      ],
      show: HIDE_DEPARTED,
    },
  },
  {
    id: 'V8', parent: 'V7', name: 'Changed platform',
    cause: 'Gatwick Airport leaves from 9, not its usual 3, and nothing says so; regulars go to 3. Platform splits confirmed into confirmed and changed, and a change is announced. Ely is both moved and late, but has one message line: the change wins, as the more urgent.',
    facts: { state: STATE3, delay: DELAY, platform: PLATFORM3, due: DUE },
    rules: {
      platform: [
        { when: { state: 'cancelled' }, then: { text: '' } },
        { when: { platform: 'unconfirmed' }, then: { text: '–' } },
        { when: { platform: 'changed' }, then: { text: '{platform}', tone: 'warn' } },
        { when: {}, then: { text: '{platform}' } },
      ],
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
        { when: { due: 'now', platform: 'confirmed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { due: 'now', platform: 'changed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { delay: 'major' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: { delay: 'minor' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: {}, then: { text: 'On time' } },
      ],
      note: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
        { when: { platform: 'changed' }, then: { text: 'Platform changed to {platform}', tone: 'warn' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: { delay: 'major' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: {}, then: { text: '' } },
      ],
      show: HIDE_DEPARTED,
    },
  },
  {
    id: 'V8b', parent: 'V7', name: 'Countdown', setAside: true,
    cause: 'A rival to V8: show minutes to go instead of clock times, as metro boards do. "Due" for trains due now, "8 min" for those soon, the time for the rest.',
    facts: { state: STATE3, delay: DELAY, platform: PLATFORM, due: DUE },
    rules: {
      platform: SETTLED_PLATFORM,
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
        { when: { due: 'now', platform: 'confirmed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { due: 'now' }, then: { text: 'Due' } },
        { when: { due: 'soon', delay: 'none' }, then: { text: '{wait} min' } },
        { when: { delay: 'major' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: { delay: 'minor' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: {}, then: { text: 'On time' } },
      ],
      note: SPLIT_NOTE,
      show: HIDE_DEPARTED,
    },
  },
  {
    id: 'V9b', parent: 'V8b', name: 'Countdown, late', setAside: true,
    cause: 'Counting down late trains too, so the board is all minutes. Set aside with V8b: on a mainline the countdown jumped every time an estimate changed, and people stopped trusting it. Times stay.',
    facts: { state: STATE3, delay: DELAY, platform: PLATFORM, due: DUE },
    rules: {
      platform: SETTLED_PLATFORM,
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
        { when: { due: 'now', platform: 'confirmed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { due: 'now' }, then: { text: 'Due' } },
        { when: { due: 'soon', delay: 'none' }, then: { text: '{wait} min' } },
        { when: { due: 'soon' }, then: { text: '{wait} min', tone: 'warn' } },
        { when: { due: 'later', delay: 'none' }, then: { text: 'On time' } },
        { when: {}, then: { text: '{wait} min', tone: 'warn' } },
      ],
      note: SPLIT_NOTE,
      show: HIDE_DEPARTED,
    },
  },
  {
    id: 'V9', parent: 'V8', name: 'Very late',
    cause: 'Canterbury West is 35 minutes late, and the board treats it like a train five minutes late. Major splits into major and severe: severe says Delayed, with the minutes and a hint to find another route. The severe message outranks a platform change.',
    facts: { state: STATE3, delay: DELAY5, platform: PLATFORM3, due: DUE },
    rules: {
      platform: [
        { when: { state: 'cancelled' }, then: { text: '' } },
        { when: { platform: 'unconfirmed' }, then: { text: '–' } },
        { when: { platform: 'changed' }, then: { text: '{platform}', tone: 'warn' } },
        { when: {}, then: { text: '{platform}' } },
      ],
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
        { when: { delay: 'severe' }, then: { text: 'Delayed', tone: 'bad' } },
        { when: { due: 'now', platform: 'confirmed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { due: 'now', platform: 'changed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { delay: 'major' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: { delay: 'minor' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: {}, then: { text: 'On time' } },
      ],
      note: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
        { when: { delay: 'severe' }, then: { text: 'Delayed by {delay} min due to {reason}. Consider other routes', tone: 'bad' } },
        { when: { platform: 'changed' }, then: { text: 'Platform changed to {platform}', tone: 'warn' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: { delay: 'major' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: {}, then: { text: '' } },
      ],
      show: HIDE_DEPARTED,
    },
  },
  {
    id: 'V10', parent: 'V9', name: 'Buses',
    cause: 'Portsmouth Harbour is cancelled for flooding, but a bus runs in its place, and the board sends its passengers home. Cancelled with a bus is a state of its own: replaced.',
    facts: { state: STATE4, delay: DELAY5, platform: PLATFORM3, due: DUE },
    rules: {
      platform: [
        { when: { state: 'cancelled' }, then: { text: '' } },
        { when: { state: 'replaced' }, then: { text: '' } },
        { when: { platform: 'unconfirmed' }, then: { text: '–' } },
        { when: { platform: 'changed' }, then: { text: '{platform}', tone: 'warn' } },
        { when: {}, then: { text: '{platform}' } },
      ],
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: { state: 'replaced' }, then: { text: 'Bus', tone: 'warn' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
        { when: { delay: 'severe' }, then: { text: 'Delayed', tone: 'bad' } },
        { when: { due: 'now', platform: 'confirmed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { due: 'now', platform: 'changed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { delay: 'major' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: { delay: 'minor' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: {}, then: { text: 'On time' } },
      ],
      note: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
        { when: { state: 'replaced' }, then: { text: 'Replacement bus from the forecourt, due to {reason}', tone: 'warn' } },
        { when: { delay: 'severe' }, then: { text: 'Delayed by {delay} min due to {reason}. Consider other routes', tone: 'bad' } },
        { when: { platform: 'changed' }, then: { text: 'Platform changed to {platform}', tone: 'warn' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: { delay: 'major' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: {}, then: { text: '' } },
      ],
      show: HIDE_DEPARTED,
    },
  },
  {
    id: 'V10b', parent: 'V9', name: 'Bus as a fact', setAside: true,
    cause: 'A rival to V10: a bus is a fact of its own (yes or no), and the board stays "Cancelled" with a message. Set aside: red "Cancelled" sent people away before they read the message, and a running train with a bus means nothing, so half the new combinations are impossible.',
    facts: { state: STATE3, delay: DELAY5, platform: PLATFORM3, due: DUE, bus: BUS },
    rules: {
      platform: [
        { when: { state: 'cancelled' }, then: { text: '' } },
        { when: { platform: 'unconfirmed' }, then: { text: '–' } },
        { when: { platform: 'changed' }, then: { text: '{platform}', tone: 'warn' } },
        { when: {}, then: { text: '{platform}' } },
      ],
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
        { when: { delay: 'severe' }, then: { text: 'Delayed', tone: 'bad' } },
        { when: { due: 'now', platform: 'confirmed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { due: 'now', platform: 'changed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { delay: 'major' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: { delay: 'minor' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: {}, then: { text: 'On time' } },
      ],
      note: [
        { when: { state: 'cancelled', bus: 'yes' }, then: { text: 'Cancelled. Replacement bus from the forecourt', tone: 'bad' } },
        { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
        { when: { delay: 'severe' }, then: { text: 'Delayed by {delay} min due to {reason}. Consider other routes', tone: 'bad' } },
        { when: { platform: 'changed' }, then: { text: 'Platform changed to {platform}', tone: 'warn' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: { delay: 'major' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: {}, then: { text: '' } },
      ],
      show: HIDE_DEPARTED,
    },
  },
  {
    id: 'V11', parent: 'V10', name: 'Short trains',
    cause: 'Cambridge and Bedford run with four coaches, and people waiting at the far end of the platform miss them. Short trains get a message, urgent when due now; more urgent messages still win, so a short train that is also late says nothing about its length.',
    facts: { state: STATE4, delay: DELAY5, platform: PLATFORM3, due: DUE, length: LENGTH },
    rules: {
      platform: [
        { when: { state: 'cancelled' }, then: { text: '' } },
        { when: { state: 'replaced' }, then: { text: '' } },
        { when: { platform: 'unconfirmed' }, then: { text: '–' } },
        { when: { platform: 'changed' }, then: { text: '{platform}', tone: 'warn' } },
        { when: {}, then: { text: '{platform}' } },
      ],
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: { state: 'replaced' }, then: { text: 'Bus', tone: 'warn' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
        { when: { delay: 'severe' }, then: { text: 'Delayed', tone: 'bad' } },
        { when: { due: 'now', platform: 'confirmed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { due: 'now', platform: 'changed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { delay: 'major' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: { delay: 'minor' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: {}, then: { text: 'On time' } },
      ],
      note: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
        { when: { state: 'replaced' }, then: { text: 'Replacement bus from the forecourt, due to {reason}', tone: 'warn' } },
        { when: { delay: 'severe' }, then: { text: 'Delayed by {delay} min due to {reason}. Consider other routes', tone: 'bad' } },
        { when: { platform: 'changed' }, then: { text: 'Platform changed to {platform}', tone: 'warn' } },
        { when: { length: 'short', due: 'now' }, then: { text: 'Short train: please move to the front now', tone: 'flash' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: { delay: 'major' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: { length: 'short' }, then: { text: 'Short train: please wait at the front' } },
        { when: {}, then: { text: '' } },
      ],
      show: HIDE_DEPARTED,
    },
  },
  {
    id: 'V12', parent: 'V11', name: 'Doors closing',
    cause: 'Once a train is at its expected time, boarding is over and running for it is dangerous. Due splits now into closing and now: closing says Doors closing and asks people to stand back. No train is closing this afternoon, so the version rests on the rule alone.',
    facts: { state: STATE4, delay: DELAY5, platform: PLATFORM3, due: DUE4, length: LENGTH },
    rules: {
      platform: [
        { when: { state: 'cancelled' }, then: { text: '' } },
        { when: { state: 'replaced' }, then: { text: '' } },
        { when: { platform: 'unconfirmed' }, then: { text: '–' } },
        { when: { platform: 'changed' }, then: { text: '{platform}', tone: 'warn' } },
        { when: {}, then: { text: '{platform}' } },
      ],
      expected: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
        { when: { state: 'replaced' }, then: { text: 'Bus', tone: 'warn' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
        { when: { delay: 'severe' }, then: { text: 'Delayed', tone: 'bad' } },
        { when: { due: 'closing', platform: 'confirmed' }, then: { text: 'Doors closing', tone: 'bad' } },
        { when: { due: 'closing', platform: 'changed' }, then: { text: 'Doors closing', tone: 'bad' } },
        { when: { due: 'now', platform: 'confirmed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { due: 'now', platform: 'changed' }, then: { text: 'Boarding', tone: 'flash' } },
        { when: { delay: 'major' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: { delay: 'minor' }, then: { text: 'Exp {expected}', tone: 'warn' } },
        { when: {}, then: { text: 'On time' } },
      ],
      note: [
        { when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
        { when: { state: 'replaced' }, then: { text: 'Replacement bus from the forecourt, due to {reason}', tone: 'warn' } },
        { when: { delay: 'severe' }, then: { text: 'Delayed by {delay} min due to {reason}. Consider other routes', tone: 'bad' } },
        { when: { due: 'closing', platform: 'confirmed' }, then: { text: 'Please stand back', tone: 'flash' } },
        { when: { due: 'closing', platform: 'changed' }, then: { text: 'Please stand back', tone: 'flash' } },
        { when: { platform: 'changed' }, then: { text: 'Platform changed to {platform}', tone: 'warn' } },
        { when: { length: 'short', due: 'now' }, then: { text: 'Short train: please move to the front now', tone: 'flash' } },
        { when: { delay: 'unknown' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: { delay: 'major' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
        { when: { length: 'short' }, then: { text: 'Short train: please wait at the front' } },
        { when: {}, then: { text: '' } },
      ],
      show: HIDE_DEPARTED,
    },
  },
];

const versionById = id => VERSIONS.find(version => version.id === id);
const parentOf = version => versionById(version.parent);
const depthOf = version => (version.parent ? depthOf(parentOf(version)) + 1 : 0);
const TRUNK = VERSIONS.filter(version => !version.setAside);

// Running a version: the facts it knows about each train, and what each part of its board shows.

const minutes = time => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
const clock = total => `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
const expectedAt = train => minutes(train.time) + (train.delay ?? 0);

const factsOf = (version, train) => Object.fromEntries(Object.entries(version.facts).map(([fact, { of }]) => [fact, of(train)]));
const matches = (rule, facts) => Object.entries(rule.when).every(([fact, value]) => facts[fact] === value);

function fill(text, train) {
  return text
    .replace('{expected}', clock(expectedAt(train)))
    .replace('{platform}', train.platform)
    .replace('{reason}', train.reason || 'a problem')
    .replace('{delay}', train.delay ?? '?')
    .replace('{wait}', waitOf(train));
}

function runVersion(version) {
  return TRAINS.map(train => {
    const facts = factsOf(version, train);
    const shows = Object.fromEntries(Object.entries(version.rules).map(([part, rules]) => {
      const rule = rules.find(candidate => matches(candidate, facts));
      return [part, { text: rule ? fill(rule.then.text, train) : '', tone: rule?.then.tone ?? 'plain' }];
    }));
    return { train, facts, shows };
  });
}

// What a version adds to its parent: facts that are new, and values that are new or gone in facts it shares.
function growthOf(version) {
  const before = parentOf(version)?.facts ?? {};
  return Object.entries(version.facts).map(([fact, { values }]) => {
    const old = before[fact]?.values ?? [];
    return {
      fact,
      isNew: !before[fact],
      added: before[fact] ? values.filter(value => !old.includes(value)) : [],
      gone: old.filter(value => !values.includes(value)),
    };
  }).filter(change => change.isNew || change.added.length || change.gone.length);
}

// The map: every combination of facts a version knows, grouped into regions that look the same on the board.

// What a train with these facts shows in the given parts of the board: each part's rule, before it's filled from the
// train. Hidden lines all look alike.
function outcomeOf(version, facts, parts = Object.keys(version.rules)) {
  return Object.fromEntries(parts.map(part => [part, version.rules[part].find(rule => matches(rule, facts)).then]));
}
const outcomeKey = outcome => (outcome.show?.text === 'hide' ? 'hidden' : JSON.stringify(outcome));

function combinations(facts) {
  return facts.reduce((all, [fact, { values }]) => all.flatMap(each => values.map(value => ({ ...each, [fact]: value }))), [{}]);
}

// Splits the facts one at a time, in order. Wherever what's shown doesn't depend on a fact, it's left whole.
// A region gives each fact its values: one, or all of them. Given some parts of the board, only they count.
function regionsOf(version, parts = Object.keys(version.rules)) {
  const pick = region => Object.fromEntries(Object.entries(region).map(([fact, values]) => [fact, values[0]]));
  function split(region, rest) {
    if (!rest.length) return [region];
    const [[fact, { values }], ...later] = rest;
    const shownBy = each => new Set(values.map(value => outcomeKey(outcomeOf(version, { ...pick(region), ...each, [fact]: value }, parts))));
    if (!combinations(later).some(each => shownBy(each).size > 1)) return split({ ...region, [fact]: values }, later);
    return values.flatMap(value => split({ ...region, [fact]: [value] }, later));
  }
  return split({}, Object.entries(version.facts)).map(facts => ({
    facts,
    size: Object.values(facts).reduce((product, values) => product * values.length, 1),
    outcome: outcomeOf(version, pick(facts), parts),
  }));
}

const isIn = (facts, region) => Object.entries(region.facts).every(([fact, values]) => values.includes(facts[fact]));
