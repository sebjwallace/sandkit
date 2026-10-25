// Scenarios: Given, When, Then, with the code that plays them against the model.
// Records: written once, never edited, only superseded; each says when, by whom and in which
// iteration it was made. Read by the page and the discovery engine. See the domain discovery practice.
const SCENARIOS = [
  { id: 'SCN-1', created: '2026-10-05T13:26', by: 'Agent', iteration: 1, title: 'A departed train leaves the board', foundedOn: ['CLM-1'],
    steps: [{ keyword: 'Given', text: 'the 13:58 to Hastings has departed' }, { keyword: 'Then', text: 'the board doesn’t show it' }],
    play: M => {
      const train = trainFor(M, { time: '13:58', destination: 'Hastings', platform: 1, departed: true });
      return [null, { ok: !new M.Board([train]).shows(train), actual: 'it is still shown' }];
    } },
  { id: 'SCN-2', created: '2026-10-05T13:33', by: 'Agent', iteration: 1, title: 'A cancelled train shows why', foundedOn: ['QST-1'],
    steps: [{ keyword: 'Given', text: 'the 14:10 to Reading is cancelled due to a shortage of train crew' },
      { keyword: 'Then', text: 'its message line says "Cancelled due to a shortage of train crew"' }],
    play: M => {
      const train = trainFor(M, { time: '14:10', destination: 'Reading', platform: 5, cancelled: true, reason: 'a shortage of train crew' });
      const message = new M.Board([train]).messageFor(train);
      return [null, { ok: message === 'Cancelled due to a shortage of train crew', actual: message || 'an empty message line' }];
    } },
  { id: 'SCN-3', created: '2026-10-05T13:40', by: 'Agent', iteration: 1, title: 'A major delay shows why', foundedOn: ['DEF-1', 'QST-1'],
    steps: [{ keyword: 'Given', text: 'the 14:08 to Oxford is 12 minutes late because of a signal fault' },
      { keyword: 'Then', text: 'its message line says "Delayed due to a signal fault"' }],
    play: M => {
      const train = trainFor(M, { time: '14:08', destination: 'Oxford', platform: 7, delay: 12, reason: 'a signal fault' });
      const message = new M.Board([train]).messageFor(train);
      return [null, { ok: message === 'Delayed due to a signal fault', actual: message || 'an empty message line' }];
    } },
  { id: 'SCN-4', created: '2026-10-05T13:47', by: 'Agent', iteration: 1, title: 'A minor delay shows its expected time', foundedOn: ['CLM-2', 'DEF-1'],
    steps: [{ keyword: 'Given', text: 'the 14:05 to Cambridge is 3 minutes late' },
      { keyword: 'Then', text: 'its expected time is "14:08"' }, { keyword: 'And', text: 'its message line is empty' }],
    play: M => {
      const train = trainFor(M, { time: '14:05', destination: 'Cambridge', platform: 2, delay: 3 });
      const expected = train.expected()?.text, message = new M.Board([train]).messageFor(train);
      return [null, { ok: expected === '14:08', actual: expected ?? 'no expected time' }, { ok: message === '', actual: message }];
    } },
  { id: 'SCN-5', created: '2026-10-05T13:54', by: 'Agent', iteration: 1, title: 'A changed platform shows a message', foundedOn: ['CLM-5', 'DEC-1'],
    steps: [{ keyword: 'Given', text: 'the 14:15 to Gatwick Airport was planned for platform 3' },
      { keyword: 'And', text: 'it now leaves from platform 9' }, { keyword: 'Then', text: 'its message line says "Platform changed to 9"' }],
    play: M => {
      const train = trainFor(M, { time: '14:15', destination: 'Gatwick Airport', platform: 9, planned: 3 });
      const message = new M.Board([train]).messageFor(train);
      return [null, null, { ok: message === 'Platform changed to 9', actual: message || 'an empty message line' }];
    } },
  { id: 'SCN-6', created: '2026-11-04T10:38', by: 'Agent', iteration: 2, title: 'A platform change is announced in time', foundedOn: ['DEC-2', 'CON-2', 'CON-3'],
    steps: [{ keyword: 'Given', text: 'the 14:15 to Gatwick Airport is moved from platform 3 to 9' },
      { keyword: 'When', text: 'signalling confirms the change at 14:07' },
      { keyword: 'Then', text: 'the PA announces it by 14:10, five minutes before departure' }],
    play: M => {
      if (!M.Announcement) throw new Error('The model has no Announcement: ENT-4 isn’t in it.');
      const train = trainFor(M, { time: '14:15', destination: 'Gatwick Airport', platform: 9, planned: 3 });
      const announcement = new M.Announcement({ train, confirmedAt: new M.ClockTime('14:07') });
      const at = announcement.announcedAt().text;
      return [null, null, { ok: announcement.inTime() && at <= '14:10', actual: `announced at ${at}` }];
    } },
  { id: 'SCN-7', created: '2026-11-04T10:50', by: 'Agent', iteration: 2, title: 'A late train that moved platform says it moved', foundedOn: ['FB-1'],
    steps: [{ keyword: 'Given', text: 'the 14:25 to Ely is 6 minutes late and moved from platform 10 to 11' },
      { keyword: 'Then', text: 'its message line says "Platform changed to 11"' }],
    play: M => {
      const train = trainFor(M, { time: '14:25', destination: 'Ely', delay: 6, platform: 11, planned: 10, reason: 'an earlier fault' });
      const message = new M.Board([train]).messageFor(train);
      return [null, { ok: message.startsWith('Platform changed to 11'), actual: message || 'an empty message line' }];
    } },
];
