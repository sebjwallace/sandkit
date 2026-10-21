// The departure board's principled model: what the board knows about each train (facts),
// what each part of the board can show (outputs), and how a configuration of rules joins them.
// A configuration is plain data; ORIGINAL is the board as it was found, and is never changed.

const STATION = 'Ashford International';

// What the board can know about a train, each fact with a few values.
const FACTS = {
  state: { label: 'State', values: ['running', 'cancelled', 'departed'] },
  delay: { label: 'Delay', values: ['none', 'minor', 'major', 'unknown'], note: 'minor: 1–4 min · major: 5 min or more · unknown: no estimate' },
  platform: { label: 'Platform', values: ['confirmed', 'changed', 'unconfirmed'], note: 'changed: not the planned platform' },
  due: { label: 'Due', values: ['now', 'soon', 'later'], note: 'now: within 2 min · soon: within 10 min' },
};

// What each part of the board can show. {expected}, {platform}, {reason} and {delay} are filled from the train.
const TABLES = {
  show: { label: 'Show the train', prefix: 'S', texts: ['show', 'hide'], toned: false },
  expected: { label: 'Expected column', prefix: 'E', texts: ['On time', 'Exp {expected}', 'Delayed', 'Cancelled', 'Departed', 'Boarding', ''], toned: true },
  platform: { label: 'Platform column', prefix: 'P', texts: ['{platform}', '–', ''], toned: true },
  note: { label: 'Message line', prefix: 'N', texts: ['', 'Delayed due to {reason}', 'Cancelled due to {reason}', 'Delayed by {delay} minutes', 'Now boarding', 'Platform changed to {platform}', 'Please stand back'], toned: true },
};

const TONES = ['plain', 'warn', 'bad', 'flash'];

// Which details each fact is worked out from (the clock is the station's), and which fill each placeholder.
const FEEDS = {
  state: ['cancelled', 'departed'],
  delay: ['delay'],
  platform: ['confirmed', 'platform', 'planned'],
  due: ['time', 'delay', 'clock'],
};
const FILLS = { '{expected}': ['time', 'delay'], '{platform}': ['platform'], '{reason}': ['reason'], '{delay}': ['delay'] };
const fieldsFilling = text => Object.entries(FILLS).filter(([placeholder]) => text.includes(placeholder)).flatMap(([, fields]) => fields);

// Each table is read top to bottom, and the first rule whose conditions all hold applies.
// A condition left out matches anything.
const ORIGINAL = {
  show: [
    { id: 'S1', when: { state: 'departed' }, then: { text: 'hide' } },
    { id: 'S2', when: {}, then: { text: 'show' } },
  ],
  expected: [
    { id: 'E1', when: { state: 'cancelled' }, then: { text: 'Cancelled', tone: 'bad' } },
    { id: 'E2', when: { delay: 'unknown' }, then: { text: 'Delayed', tone: 'warn' } },
    { id: 'E3', when: { delay: 'major' }, then: { text: 'Exp {expected}', tone: 'warn' } },
    { id: 'E4', when: { delay: 'minor' }, then: { text: 'Exp {expected}', tone: 'warn' } },
    { id: 'E5', when: {}, then: { text: 'On time', tone: 'plain' } },
  ],
  platform: [
    { id: 'P1', when: { state: 'cancelled' }, then: { text: '', tone: 'plain' } },
    { id: 'P2', when: { platform: 'unconfirmed' }, then: { text: '–', tone: 'plain' } },
    { id: 'P3', when: {}, then: { text: '{platform}', tone: 'plain' } },
  ],
  note: [
    { id: 'N1', when: { state: 'cancelled' }, then: { text: 'Cancelled due to {reason}', tone: 'bad' } },
    { id: 'N2', when: { delay: 'unknown' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
    { id: 'N3', when: { delay: 'major' }, then: { text: 'Delayed due to {reason}', tone: 'warn' } },
    { id: 'N4', when: {}, then: { text: '', tone: 'plain' } },
  ],
};

// Sets of trains to run every configuration against: the input presets. Each is a moment at the station.
// delay is in minutes, null when there's no estimate.
const DATA = [
  {
    id: 'afternoon', name: 'A quiet afternoon', now: '14:00', trains: [
      { id: 'T1', time: '14:02', destination: 'Brighton', delay: 0, platform: '4', planned: '4', confirmed: true, cancelled: false, departed: false, reason: '' },
      { id: 'T2', time: '14:05', destination: 'Cambridge', delay: 3, platform: '2', planned: '2', confirmed: true, cancelled: false, departed: false, reason: 'a late-running freight train' },
      { id: 'T3', time: '14:08', destination: 'Oxford', delay: 12, platform: '7', planned: '7', confirmed: true, cancelled: false, departed: false, reason: 'a signal fault' },
      { id: 'T4', time: '14:10', destination: 'Reading', delay: 0, platform: '5', planned: '5', confirmed: true, cancelled: true, departed: false, reason: 'a shortage of train crew' },
      { id: 'T5', time: '14:12', destination: 'Dover Priory', delay: null, platform: '', planned: '3', confirmed: false, cancelled: false, departed: false, reason: 'a broken-down train' },
      { id: 'T6', time: '14:15', destination: 'Gatwick Airport', delay: 0, platform: '9', planned: '3', confirmed: true, cancelled: false, departed: false, reason: '' },
      { id: 'T7', time: '14:20', destination: 'Bedford', delay: 0, platform: '', planned: '8', confirmed: false, cancelled: false, departed: false, reason: '' },
      { id: 'T8', time: '13:58', destination: 'Hastings', delay: 0, platform: '1', planned: '1', confirmed: true, cancelled: false, departed: true, reason: '' },
      { id: 'T9', time: '14:25', destination: 'Ely', delay: 6, platform: '11', planned: '10', confirmed: true, cancelled: false, departed: false, reason: 'an earlier fault' },
      { id: 'T10', time: '13:55', destination: 'Luton', delay: 7, platform: '6', planned: '6', confirmed: true, cancelled: false, departed: false, reason: 'congestion' },
      { id: 'T11', time: '14:18', destination: 'Portsmouth Harbour', delay: 0, platform: '', planned: '12', confirmed: false, cancelled: true, departed: false, reason: 'flooding' },
    ],
  },
  {
    id: 'rush-hour', name: 'Rush hour, signal failure', now: '17:30', trains: [
      { id: 'R1', time: '17:28', destination: 'Brighton', delay: null, platform: '', planned: '4', confirmed: false, cancelled: false, departed: false, reason: 'a signal failure at Tonbridge' },
      { id: 'R2', time: '17:32', destination: 'Cambridge', delay: 25, platform: '2', planned: '2', confirmed: true, cancelled: false, departed: false, reason: 'a signal failure at Tonbridge' },
      { id: 'R3', time: '17:35', destination: 'Oxford', delay: 0, platform: '7', planned: '7', confirmed: true, cancelled: true, departed: false, reason: 'a signal failure at Tonbridge' },
      { id: 'R4', time: '17:40', destination: 'Reading', delay: null, platform: '5', planned: '5', confirmed: true, cancelled: false, departed: false, reason: 'a signal failure at Tonbridge' },
      { id: 'R5', time: '17:20', destination: 'Dover Priory', delay: 14, platform: '9', planned: '3', confirmed: true, cancelled: false, departed: false, reason: 'a signal failure at Tonbridge' },
      { id: 'R6', time: '17:45', destination: 'Gatwick Airport', delay: 0, platform: '', planned: '3', confirmed: false, cancelled: true, departed: false, reason: 'a signal failure at Tonbridge' },
      { id: 'R7', time: '17:29', destination: 'Hastings', delay: 1, platform: '1', planned: '1', confirmed: true, cancelled: false, departed: true, reason: '' },
      { id: 'R8', time: '17:50', destination: 'Ely', delay: 2, platform: '10', planned: '10', confirmed: true, cancelled: false, departed: false, reason: 'congestion' },
      { id: 'R9', time: '17:31', destination: 'Luton', delay: 0, platform: '6', planned: '6', confirmed: true, cancelled: false, departed: false, reason: '' },
    ],
  },
  {
    id: 'last-trains', name: 'The last trains', now: '23:40', trains: [
      { id: 'L1', time: '23:41', destination: 'Brighton', delay: 0, platform: '4', planned: '4', confirmed: true, cancelled: false, departed: false, reason: '' },
      { id: 'L2', time: '23:52', destination: 'Cambridge', delay: 0, platform: '', planned: '2', confirmed: false, cancelled: false, departed: false, reason: '' },
      { id: 'L3', time: '23:58', destination: 'Oxford', delay: 0, platform: '', planned: '7', confirmed: false, cancelled: true, departed: false, reason: 'engineering works' },
      { id: 'L4', time: '23:35', destination: 'Reading', delay: 0, platform: '5', planned: '5', confirmed: true, cancelled: false, departed: true, reason: '' },
      { id: 'L5', time: '23:45', destination: 'Bedford', delay: 3, platform: '2', planned: '1', confirmed: true, cancelled: false, departed: false, reason: 'a late-running train' },
      { id: 'L6', time: '23:59', destination: 'Dover Priory', delay: null, platform: '3', planned: '3', confirmed: true, cancelled: false, departed: false, reason: 'a late-running train' },
    ],
  },
];

const minutes = clock => { const [h, m] = clock.split(':').map(Number); return h * 60 + m; };
const clock = total => `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
const expectedAt = train => minutes(train.time) + (train.delay ?? 0);

function stateOf(train) {
  if (train.cancelled) return 'cancelled';
  return train.departed ? 'departed' : 'running';
}

function delayOf(train) {
  if (train.delay === null) return 'unknown';
  if (train.delay === 0) return 'none';
  return train.delay < 5 ? 'minor' : 'major';
}

function platformOf(train) {
  if (!train.confirmed) return 'unconfirmed';
  return train.platform === train.planned ? 'confirmed' : 'changed';
}

function dueOf(train, now) {
  const wait = expectedAt(train) - minutes(now);
  if (wait <= 2) return 'now';
  return wait <= 10 ? 'soon' : 'later';
}

function factsOf(train, now) {
  return { state: stateOf(train), delay: delayOf(train), platform: platformOf(train), due: dueOf(train, now) };
}

const matches = (rule, facts) => Object.entries(rule.when).every(([fact, value]) => facts[fact] === value);

function fill(text, train) {
  return text
    .replace('{expected}', clock(expectedAt(train)))
    .replace('{platform}', train.platform)
    .replace('{reason}', train.reason || 'a problem')
    .replace('{delay}', train.delay ?? '?');
}

// Programming by example. An example says what one part of the board should show for a train with given facts:
// { table, facts, then }. The model finds a rule that makes it so, and checks every example against the rules.

const decide = (config, table, facts) => config[table].find(rule => matches(rule, facts));
const sameThen = (a, b) => a.text === b.text && (a.tone ?? 'plain') === (b.tone ?? 'plain');

function holds(config, example) {
  const rule = decide(config, example.table, example.facts);
  return Boolean(rule) && sameThen(rule.then, example.then);
}

// The rules with one more: conditions on the kept facts only, placed just above the rule that decides the example now.
function withRule(config, example, keep, id) {
  const next = JSON.parse(JSON.stringify(config));
  const rules = next[example.table];
  const now = rules.findIndex(rule => matches(rule, example.facts));
  const when = Object.fromEntries(keep.map(fact => [fact, example.facts[fact]]));
  rules.splice(now === -1 ? rules.length : now, 0, { id, when, then: { ...example.then } });
  return next;
}

// The widest rule the examples allow: drop each condition in turn, keeping the drop only while every example still holds.
function widest(config, example, examples, id) {
  let keep = Object.keys(FACTS);
  for (const fact of Object.keys(FACTS)) {
    const fewer = keep.filter(kept => kept !== fact);
    const next = withRule(config, example, fewer, id);
    if ([...examples, example].every(each => holds(next, each))) keep = fewer;
  }
  return keep;
}

// Runs a configuration against a set of trains: what each part of the board shows, and which rule decided it.
function runBoard(config, data) {
  return data.trains.map(train => {
    const facts = factsOf(train, data.now);
    const shows = {};
    const fired = {};
    for (const table of Object.keys(TABLES)) {
      const rule = config[table].find(candidate => matches(candidate, facts));
      fired[table] = rule?.id;
      shows[table] = rule ? { text: fill(rule.then.text, train), tone: rule.then.tone } : { text: '', tone: 'plain' };
    }
    return { train, facts, shows, fired };
  });
}
