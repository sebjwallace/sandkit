// Sandkit sb-discovery-card 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// One card of domain discovery: a source, a claim, a question, a decision, a run, or any other
// kind the practice names, each with its own icon and tone. Shown compact on a board, normal with
// its folds closed, or expanded near full screen with every fold open. The sandbox works out every status and what's "as of" when; the card
// draws exactly what it's given.
//
//   <sb-discovery-card variant="compact" openable></sb-discovery-card>
//   card.card = { id: 'CLM-2', kind: 'claim', status: 'corroborated', text: '…', strips: [...], folds: [...] };
//   card.addEventListener('sb-open', (e) => open(e.detail.ref));
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-discovery-card';
  const existing = customElements.get('sb-discovery-card');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-discovery-card>, so only one can run. Rename one by replacing every "sb-discovery-card" in its file.`);
    }
    return;
  }

  const TONE = {
    accent: 'var(--sb-accent, #2563eb)',
    good: 'var(--sb-good, #3f9142)',
    warn: 'var(--sb-warn, #d69e2e)',
    bad: 'var(--sb-bad, #c53030)',
    muted: 'var(--sb-muted, #616e7c)',
    text: 'var(--sb-text, #1f2933)',
  };
  const mix = (a, b, share = 50) => `color-mix(in srgb, ${TONE[a]} ${share}%, ${TONE[b]})`;

  // Each kind has its own icon, drawn for a 16×16 box: a claim is something said, a question is
  // asked, a decision takes one path of several, an action is a box to tick, a risk is a warning,
  // and source material is a sheet of paper.
  const PAGE = '<path d="M4 1.75h5.5L12.5 4.75v9a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-11.5a.5.5 0 0 1 .5-.5z"/><path d="M9.5 1.75v3h3"/>';
  const KINDS = {
    // What we know
    source: { label: 'Source', tone: TONE.text, icon: PAGE },
    investigation: { label: 'Investigation', tone: TONE.accent, icon: '<circle cx="7" cy="7" r="4.5"/><path d="m10.25 10.25 3.5 3.5"/>' },
    observation: { label: 'Observation', tone: TONE.text, icon: '<circle cx="8" cy="8" r="4.25"/><path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3"/>' },
    metric: { label: 'Metric', tone: TONE.accent, icon: '<rect x="1.75" y="5.25" width="12.5" height="5.5" rx="1"/><path d="M4.5 5.25v2M7 5.25v2.75M9.5 5.25v2M12 5.25v2.75"/>' },
    claim: { label: 'Claim', tone: TONE.accent, icon: '<path d="M3 3.5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7.5L4.5 14v-2.5H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"/><path d="M5 6.5h6M5 8.5h4"/>' },
    definition: { label: 'Definition', tone: TONE.muted, icon: '<path d="M2.5 2.5h5.25L13.5 8.25 8.25 13.5 2.5 7.75z"/><circle cx="5.5" cy="5.5" r="0.9" fill="currentColor"/>' },
    opinion: { label: 'Opinion', tone: mix('warn', 'bad', 60), icon: '<circle cx="6" cy="5.5" r="2.5"/><path d="M1.75 13.75a4.25 4.25 0 0 1 8.5 0"/><path d="M11 2.5h3.5v3h-1.25L12 6.75V5.5h-1z"/>' },
    inference: { label: 'Inference', tone: TONE.accent, icon: '<circle cx="8" cy="4" r="1.25" fill="currentColor"/><circle cx="4.25" cy="11.5" r="1.25" fill="currentColor"/><circle cx="11.75" cy="11.5" r="1.25" fill="currentColor"/>' },
    assumption: { label: 'Assumption', tone: TONE.warn, icon: '<path d="M3 3.5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7.5L4.5 14v-2.5H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z" stroke-dasharray="2 1.6"/>' },
    question: { label: 'Question', tone: TONE.warn, icon: '<circle cx="8" cy="8" r="6.25"/><path d="M6.25 6.4a1.8 1.8 0 1 1 2.5 1.65c-.45.25-.75.6-.75 1.1v.35"/><path d="M8 11.4v.1"/>' },
    feedback: { label: 'Feedback', tone: mix('accent', 'warn'), icon: '<path d="M3.5 2.5 12 6.75l-3.75 1.5L6.75 12z"/><path d="m8.5 8.5 4 4"/>' },
    awaited: { label: 'Awaited', tone: TONE.muted, icon: `<g stroke-dasharray="2 1.6">${PAGE}</g>` },
    // Where we're going
    outcome: { label: 'Outcome', tone: TONE.text, icon: '<path d="M13.5 3.5v4a2 2 0 0 1-2 2h-8"/><path d="m6 6.5-3 3 3 3"/>' },
    goal: { label: 'Goal', tone: TONE.accent, icon: '<circle cx="8" cy="8" r="6.25"/><circle cx="8" cy="8" r="3.25"/><circle cx="8" cy="8" r="0.6" fill="currentColor"/>' },
    prediction: { label: 'Prediction', tone: TONE.accent, icon: '<path d="M2.5 13.5 10.5 5.5" stroke-dasharray="2 1.8"/><path d="M6.5 4.5h5v5"/>' },
    agreement: { label: 'Agreement', tone: mix('accent', 'good'), icon: '<path d="M6.5 9.5 9.5 6.5"/><path d="M7 4.5 8.25 3.25a2.5 2.5 0 0 1 3.5 3.5L10.5 8"/><path d="M5.5 8 4.25 9.25a2.5 2.5 0 0 0 3.5 3.5L9 11.5"/>' },
    constraint: { label: 'Constraint', tone: mix('accent', 'bad'), icon: '<path d="M2.5 2.5v11M13.5 2.5v11"/><path d="M5 8h6"/><path d="m7 6-2 2 2 2M9 6l2 2-2 2"/>' },
    decision: { label: 'Decision', tone: TONE.good, icon: '<path d="M8 14.5V9l4.5-5.5"/><path d="M9.75 3.5h2.75v2.75"/><path d="M8 9 3.5 3.5" opacity="0.35"/>' },
    experiment: { label: 'Experiment', tone: TONE.good, icon: '<path d="M6 2h4M6.5 2v4.5L3 13a.75.75 0 0 0 .65 1.1h8.7A.75.75 0 0 0 13 13L9.5 6.5V2"/><path d="M4.75 10.5h6.5"/>' },
    action: { label: 'Action', tone: TONE.accent, icon: '<rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2"/><path d="m5 8.25 2 2 4-4.5"/>' },
    risk: { label: 'Risk', tone: TONE.bad, icon: '<path d="M8 2 14.5 13.5h-13z"/><path d="M8 6.5v3.25M8 11.6v.1"/>' },
    // What we're building
    entity: { label: 'Entity', tone: TONE.accent, icon: '<path d="M8 1.75 13.5 4.75v6.5L8 14.25 2.5 11.25v-6.5z"/><path d="M2.5 4.75 8 7.75l5.5-3M8 7.75v6.5"/>' },
    primitive: { label: 'Domain primitive', tone: TONE.muted, icon: '<path d="M8 3 12.5 8 8 13 3.5 8z"/>' },
    scenario: { label: 'Scenario', tone: mix('accent', 'good'), icon: '<rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2"/><path d="m6.5 5.25 4.25 2.75-4.25 2.75z"/>' },
    rule: { label: 'Rule', tone: TONE.text, icon: '<path d="M3 3.5h10M3 8h10M3 12.5h5"/><path d="m10 12.25 1.5 1.5 2.5-2.75"/>' },
    run: { label: 'Run', tone: TONE.accent, icon: '<rect x="3" y="2.75" width="10" height="11.5" rx="1.5"/><path d="M6 2.75h4v2H6z"/><path d="m5.75 9.25 1.75 1.75 3-3.25"/>' },
  };

  // A source's page is marked with what's on it, drawn finer than the page so it reads small.
  const FORMAT_MARKS = {
    document: '<path d="M5.75 8h4.5M5.75 10.5h4.5"/>',
    notes: '<path d="M5.75 8h.01M7.75 8h2.5M5.75 10.75h.01M7.75 10.75h2.5"/>',
    data: '<rect x="5.5" y="7.25" width="5" height="5" rx="0.5"/><path d="M5.5 9.75h5M8 7.25v5"/>',
    image: '<path d="m5.25 12.25 1.75-2.25 1.25 1.25 1-1 1.5 2"/><circle cx="9.5" cy="7.75" r="0.5" fill="currentColor"/>',
    web: '<circle cx="8" cy="9.75" r="2.6"/><path d="M5.4 9.75h5.2M8 7.15c-1.1 1.4-1.1 3.8 0 5.2M8 7.15c1.1 1.4 1.1 3.8 0 5.2"/>',
    analysis: '<path d="M6 12.5v-2M8 12.5v-4.5M10 12.5v-3"/>',
  };

  // Every status word the practice uses, by what it says: fine, needs a look, wrong, under way, or settled.
  const STATUS_TONES = {
    good: ['corroborated', 'answered', 'confirmed', 'met', 'integrated', 'done', 'borne out', 'supported', 'sound', 'in force', 'worked', 'accepted', 'on track', 'earns its place', 'arrived'],
    warn: ['contested', 'unresolved', 'trying', 'in doubt', 'untested', 'shaken', 'partly', 'review', 'not yet', 'open'],
    bad: ['refuted', 'broken', 'not met', 'rejected', 'not borne out', 'failed', 'off track'],
    accent: ['single source', 'proposed', 'under way', 'planned', 'to do'],
    muted: ['held', 'holds', 'pending', 'awaited', 'superseded', 'unbacked', 'declined'],
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // `2026-10-20T14:30` reads as `20 Oct 2026, 14:30`; anything else is shown as given.
  function formatWhen(when) {
    const match = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d:\d\d))?/.exec(when ?? '');
    if (!match) return when;
    const [, year, month, day, time] = match;
    return `${Number(day)} ${MONTHS[month - 1]} ${year}${time ? `, ${time}` : ''}`;
  }

  const STANCES = { '+': 'yes', '-': 'no', '−': 'no', '?': 'asks' };

  const kindRules = Object.entries(KINDS)
    .map(([kind, { tone }]) => `.sb-discovery-card [data-kind="${kind}"] { --sb-discovery-card-tone: ${tone}; }`).join('\n');
  const statusRules = Object.entries(STATUS_TONES)
    .flatMap(([tone, words]) => words.map((word) => `.sb-discovery-card__status[data-status="${word}"] { --sb-discovery-card-status: ${TONE[tone]}; }`)).join('\n');

  // A card wears a header band over its body, as every record does. Compact cards are smaller, on a
  // band's colour; a source, compact or not, and every passage, is paper, because they're source material.
  const CSS = `
    .sb-discovery-card { display: block; min-width: 0; color: var(--sb-text, #1f2933); font-size: 13px; line-height: 1.45; }
    .sb-discovery-card [data-kind] { --sb-discovery-card-tone: var(--sb-muted, #616e7c); }
    ${kindRules}
    .sb-discovery-card__icon { flex: none; display: grid; place-items: center; width: 24px; height: 24px; margin: -1px 0; border-radius: 6px; color: var(--sb-discovery-card-tone); background: color-mix(in srgb, var(--sb-discovery-card-tone) 16%, transparent); }
    .sb-discovery-card__id { flex: none; padding: 1px 7px; border-radius: 999px; background: var(--sb-surface, #fff); color: var(--sb-muted, #616e7c); font: 600 11px/1.6 ui-monospace, Menlo, Consolas, monospace; }
    .sb-discovery-card__status { --sb-discovery-card-status: var(--sb-muted, #616e7c); padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; color: var(--sb-discovery-card-status); background: color-mix(in srgb, var(--sb-discovery-card-status) 16%, transparent); }
    ${statusRules}
    .sb-discovery-card__badge { padding: 1px 8px; border-radius: 999px; border: 1px solid var(--sb-border, #d5d9e0); color: var(--sb-muted, #616e7c); font-size: 11px; font-style: italic; white-space: nowrap; }
    .sb-discovery-card__badge[data-tone] { border-color: currentColor; font-style: normal; font-weight: 700; font-variant-numeric: tabular-nums; }
    .sb-discovery-card__badge[data-tone="good"] { color: ${TONE.good}; }
    .sb-discovery-card__badge[data-tone="warn"] { color: ${TONE.warn}; border-style: dashed; }
    .sb-discovery-card__badge[data-tone="bad"] { color: ${TONE.bad}; }
    .sb-discovery-card__badge[data-tone="accent"] { color: ${TONE.accent}; }
    .sb-discovery-card__format { padding: 0 5px; border: 1px solid color-mix(in srgb, var(--sb-text, #1f2933) 24%, transparent); border-radius: 4px; color: var(--sb-muted, #616e7c); font-size: 10px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; }

    .sb-discovery-card__card { overflow: hidden; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); transition: border-color 0.15s, box-shadow 0.15s; }
    .sb-discovery-card__head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 14px; background: var(--sb-discovery-card-band, var(--sb-surface-2, #eef0f3)); border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-discovery-card__byline { flex: 1 1 120px; min-width: 0; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-discovery-card__badges { flex: none; display: flex; flex-wrap: wrap; gap: 6px; margin-left: auto; }
    .sb-discovery-card__body { display: grid; gap: 12px; padding: 12px 14px; }
    .sb-discovery-card__column { display: grid; gap: 12px; align-content: start; min-width: 0; }
    .sb-discovery-card__body--split { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px 20px; align-items: start; }
    .sb-discovery-card__foot { display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 7px 14px; background: var(--sb-discovery-card-band, var(--sb-surface-2, #eef0f3)); border-top: 1px solid var(--sb-border, #d5d9e0); color: var(--sb-muted, #616e7c); font-size: 11px; }
    .sb-discovery-card__meta-label { margin-right: 5px; font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
    .sb-discovery-card__meta-text--file { font-family: ui-monospace, Menlo, Consolas, monospace; }

    .sb-discovery-card__strip { --sb-discovery-card-strip: ${TONE.accent}; padding: 8px 12px; border-left: 3px solid var(--sb-discovery-card-strip); border-radius: 0 var(--sb-radius, 8px) var(--sb-radius, 8px) 0; background: color-mix(in srgb, var(--sb-discovery-card-strip) 14%, var(--sb-surface, #fff)); }
    .sb-discovery-card__strip--main .sb-discovery-card__text { font-weight: 600; font-size: 14px; line-height: 1.4; }
    .sb-discovery-card__strip--note { --sb-discovery-card-strip: ${TONE.muted}; }
    .sb-discovery-card__strip--answer { --sb-discovery-card-strip: ${TONE.good}; }
    .sb-discovery-card__strip--warn { --sb-discovery-card-strip: ${TONE.warn}; }
    .sb-discovery-card__strip--expect { border-left-style: dashed; background: color-mix(in srgb, var(--sb-discovery-card-strip) 7%, var(--sb-surface, #fff)); }
    .sb-discovery-card__strip--unresolved { --sb-discovery-card-strip: ${TONE.warn}; border-left-style: dashed; }
    .sb-discovery-card__strip--unresolved .sb-discovery-card__text { color: var(--sb-muted, #616e7c); font-style: italic; }
    .sb-discovery-card__label { margin: 0 0 4px; color: var(--sb-discovery-card-strip, var(--sb-muted, #616e7c)); font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
    .sb-discovery-card__text { margin: 0; white-space: pre-wrap; }

    .sb-discovery-card__fold > summary { display: flex; align-items: center; gap: 6px; color: var(--sb-muted, #616e7c); font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; list-style: none; cursor: pointer; }
    .sb-discovery-card__fold > summary::-webkit-details-marker { display: none; }
    .sb-discovery-card__fold > summary::before { content: '▸'; font-size: 10px; transition: transform 0.15s; }
    .sb-discovery-card__fold[open] > summary::before { transform: rotate(90deg); }
    .sb-discovery-card__fold > summary:hover { color: var(--sb-text, #1f2933); }
    .sb-discovery-card__items { display: grid; gap: 8px; margin: 8px 0 0; padding: 0; list-style: none; }
    .sb-discovery-card__item > .sb-discovery-card__text { color: var(--sb-muted, #616e7c); }

    /* Paper: source material, wherever it appears. The holder casts the shadow and draws the folded
       corner; the sheet inside is clipped to cut the corner away. */
    .sb-discovery-card__paper { --sb-discovery-card-fold: 12px; --sb-discovery-card-edge: color-mix(in srgb, var(--sb-text, #1f2933) 24%, transparent); --sb-discovery-card-sheet: var(--sb-discovery-card-paper, color-mix(in srgb, var(--sb-surface, #fff) 94%, #f3e2b8)); position: relative; display: flex; min-width: 0; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.12)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12)); }
    .sb-discovery-card__paper::after { content: ''; position: absolute; top: 0; right: 0; width: var(--sb-discovery-card-fold); height: var(--sb-discovery-card-fold); border-left: 1px solid var(--sb-discovery-card-edge); border-bottom: 1px solid var(--sb-discovery-card-edge); border-bottom-left-radius: 2px; background: linear-gradient(to top right, color-mix(in srgb, var(--sb-discovery-card-sheet) 84%, var(--sb-text, #1f2933)) 50%, transparent 50%); pointer-events: none; }
    .sb-discovery-card .sb-discovery-card__paper > * { flex: 1; min-width: 0; border: 1px solid var(--sb-discovery-card-edge); border-radius: 2px; clip-path: polygon(0 0, calc(100% - var(--sb-discovery-card-fold)) 0, 100% var(--sb-discovery-card-fold), 100% 100%, 0 100%); background: linear-gradient(135deg, color-mix(in srgb, var(--sb-discovery-card-sheet) 97%, #fff), var(--sb-discovery-card-sheet) 45%, color-mix(in srgb, var(--sb-discovery-card-sheet) 93%, #000)); }
    .sb-discovery-card__paper .sb-discovery-card__compact-head { padding-right: var(--sb-discovery-card-fold); }
    .sb-discovery-card__slip { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; padding: 6px 16px 6px 10px; color: inherit; font: inherit; text-align: left; cursor: pointer; }
    .sb-discovery-card__slip:focus-visible { outline: 2px solid ${TONE.accent}; outline-offset: -2px; }
    .sb-discovery-card__stance { flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 999px; color: var(--sb-accent-text, #fff); font-weight: 700; }
    .sb-discovery-card__stance[data-stance="yes"] { background: ${TONE.good}; }
    .sb-discovery-card__stance[data-stance="no"] { background: ${TONE.bad}; }
    .sb-discovery-card__stance[data-stance="asks"] { background: ${TONE.accent}; }
    .sb-discovery-card__source { flex: none; padding: 0 6px; border-radius: 4px; background: color-mix(in srgb, var(--sb-text, #1f2933) 8%, transparent); color: var(--sb-muted, #616e7c); font: 600 11px/1.6 ui-monospace, Menlo, Consolas, monospace; }
    .sb-discovery-card__passage-note { margin-left: auto; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-discovery-card__quote { flex-basis: 100%; font: italic 13px/1.5 Georgia, 'Iowan Old Style', 'Times New Roman', serif; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; }
    .sb-discovery-card--expanded .sb-discovery-card__quote { display: block; }

    .sb-discovery-card__option { padding: 6px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); opacity: 0.65; }
    .sb-discovery-card__option--chosen { padding: 5px 9px; border: 2px solid ${TONE.good}; opacity: 1; }
    .sb-discovery-card__option-head { display: flex; align-items: center; gap: 6px; }
    .sb-discovery-card__option-title { font-weight: 600; }
    .sb-discovery-card__chosen { margin-left: auto; padding: 1px 7px; border-radius: 999px; background: ${TONE.good}; color: var(--sb-accent-text, #fff); font-size: 11px; white-space: nowrap; }
    .sb-discovery-card__points { display: flex; flex-wrap: wrap; gap: 0 14px; margin: 2px 0 0; padding: 0; list-style: none; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-discovery-card__point::before { display: inline-block; width: 1em; font-weight: 700; }
    .sb-discovery-card__point--pro::before { content: '+'; color: ${TONE.good}; }
    .sb-discovery-card__point--con::before { content: '−'; color: ${TONE.bad}; }

    .sb-discovery-card__compact { display: grid; gap: 4px; width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: inherit; font: inherit; font-size: 12px; line-height: 1.35; text-align: left; transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s; }
    button.sb-discovery-card__compact { cursor: pointer; }
    button.sb-discovery-card__compact:hover { border-color: color-mix(in srgb, ${TONE.accent} 50%, var(--sb-border, #d5d9e0)); }
    .sb-discovery-card__compact:focus-visible { outline: 2px solid ${TONE.accent}; outline-offset: 1px; }
    .sb-discovery-card__compact--assumed { border-style: dashed; border-color: ${TONE.warn}; }
    .sb-discovery-card__compact--carried { background: none; }
    .sb-discovery-card__compact--awaited { border-style: dashed; background: none; color: var(--sb-muted, #616e7c); }
    .sb-discovery-card__compact-head { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
    .sb-discovery-card__compact .sb-discovery-card__icon { width: 20px; height: 20px; }
    .sb-discovery-card__compact .sb-discovery-card__icon svg { width: 13px; height: 13px; }
    .sb-discovery-card__compact .sb-discovery-card__status { margin-left: auto; padding: 1px 7px; font-size: 10px; }
    .sb-discovery-card__compact .sb-discovery-card__format { margin-left: auto; }
    .sb-discovery-card__compact .sb-discovery-card__status + .sb-discovery-card__format { margin-left: 0; }
    .sb-discovery-card__compact-text { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
    .sb-discovery-card__note { color: var(--sb-muted, #616e7c); font-size: 11px; font-style: italic; }
    .sb-discovery-card__file { color: var(--sb-muted, #616e7c); font: 10px ui-monospace, Menlo, Consolas, monospace; }

    .sb-discovery-card--highlighted > .sb-discovery-card__card, .sb-discovery-card--highlighted > .sb-discovery-card__compact,
    .sb-discovery-card__compact.sb-discovery-card__part--highlighted, .sb-discovery-card__option.sb-discovery-card__part--highlighted { border-color: ${TONE.accent}; box-shadow: 0 0 0 3px var(--sb-accent-soft, #eaf0ff); opacity: 1; }
    .sb-discovery-card.sb-discovery-card--highlighted > .sb-discovery-card__paper > *, .sb-discovery-card .sb-discovery-card__paper.sb-discovery-card__part--highlighted > * { background: color-mix(in srgb, ${TONE.accent} 14%, var(--sb-discovery-card-sheet)); }`;

  function addStyle() {
    if (document.getElementById('sb-discovery-card-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-discovery-card-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // An element with the component's classes: `el('div', 'strip strip--main', text)`. Text is only
  // ever set as text, never as markup.
  function el(tag, parts, text) {
    const node = document.createElement(tag);
    if (parts) node.className = parts.split(' ').map((part) => `sb-discovery-card__${part}`).join(' ');
    if (text != null) node.textContent = text;
    return node;
  }

  function icon(card) {
    const kind = KINDS[card.kind];
    const format = card.kind === 'source' && card.format;
    const drawing = format ? `${PAGE}<g stroke-width="1.1">${FORMAT_MARKS[format] ?? FORMAT_MARKS.document}</g>`
      : kind?.icon ?? '<circle cx="8" cy="8" r="5"/>';
    const holder = el('span', 'icon');
    holder.title = format ? `Source · ${format}` : kind?.label ?? String(card.kind ?? '');
    holder.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing}</svg>`;
    return holder;
  }

  function status(word) {
    const pill = el('span', 'status', word);
    pill.dataset.status = word;
    return pill;
  }

  function badge({ text, tone, title }) {
    const pill = el('span', 'badge', text);
    if (tone) pill.dataset.tone = tone;
    if (title) pill.title = title;
    return pill;
  }

  // The compact card a board shows: icon, id, status, the text clamped to three lines, notes, file.
  // One to open is a button; `nested` ones sit inside another card's fold and carry their ref.
  function compact(card, { openable = false, nested = false } = {}) {
    const marks = (card.marks ?? []).map((mark) => ` compact--${mark}`).join('');
    const root = el(openable ? 'button' : 'div', `compact${marks}`);
    root.dataset.kind = card.kind;
    if (openable) {
      root.type = 'button';
      root.dataset.open = card.id;
    }
    if (nested) root.dataset.ref = card.id;
    const head = el('span', 'compact-head');
    head.append(icon(card), el('span', 'id', card.id));
    if (card.status) head.append(status(card.status));
    if (card.format) head.append(el('span', 'format', card.format));
    root.append(head);
    if (card.text) root.append(el('span', 'compact-text', card.text));
    for (const note of card.notes ?? []) root.append(el('span', 'note', note));
    if (card.file) root.append(el('span', 'file', card.file));
    return card.kind === 'source' ? onPaper(root) : root;
  }

  function strip({ tone = 'note', label, text }) {
    const block = el('div', `strip strip--${tone}`);
    if (label) block.append(el('div', 'label', label));
    block.append(el('p', 'text', text));
    return block;
  }

  // Source material is paper wherever it appears. The holder takes over the ref, so pointing at
  // and lighting the paper work as they do for anything else in a fold.
  function onPaper(sheet) {
    const holder = el('div', 'paper');
    if (sheet.dataset.ref) {
      holder.dataset.ref = sheet.dataset.ref;
      delete sheet.dataset.ref;
    }
    holder.append(sheet);
    return holder;
  }

  // A passage of source material, on its paper: whether it says yes, no or asks, the source, and
  // the words. Clicking it asks the sandbox to open the source there.
  function passage({ source, quote, stance, note }) {
    const slip = el('button', 'slip');
    slip.dataset.ref = source;
    slip.type = 'button';
    slip.dataset.open = source;
    if (quote) slip.dataset.quote = quote;
    if (STANCES[stance]) {
      const mark = el('span', 'stance', stance === '-' ? '−' : stance);
      mark.dataset.stance = STANCES[stance];
      slip.append(mark);
    }
    slip.append(el('span', 'source', source));
    if (note) slip.append(el('span', 'passage-note', note));
    if (quote) slip.append(el('span', 'quote', `“${quote}”`));
    return onPaper(slip);
  }

  // One option weighed: the chosen one marked, the others faded.
  function option({ title, pros = [], cons = [], chosen, ref }) {
    const box = el('div', chosen ? 'option option--chosen' : 'option');
    if (ref) box.dataset.ref = ref;
    const head = el('div', 'option-head');
    head.append(el('span', 'option-title', title));
    if (chosen) head.append(el('span', 'chosen', '✓ Chosen'));
    const points = el('ul', 'points');
    for (const pro of pros) points.append(el('li', 'point point--pro', pro));
    for (const con of cons) points.append(el('li', 'point point--con', con));
    box.append(head, points);
    return box;
  }

  // The card's own record, apart from what it says: when it was made, by whom and in which
  // iteration, its file, and whatever else the sandbox keeps about it. Nothing to show, no footer.
  function footer(card) {
    const made = [formatWhen(card.created), card.by && `by ${card.by}`].filter(Boolean).join(' ');
    const entries = [
      made && ['Created', made],
      card.iteration != null && ['Iteration', String(card.iteration)],
      card.file && ['File', card.file, 'file'],
      ...(card.meta ?? []).map(({ label, text }) => [label, text]),
    ].filter(Boolean);
    if (!entries.length) return null;
    const foot = el('footer', 'foot');
    for (const [label, text, look] of entries) {
      const pair = el('span', 'meta');
      pair.append(el('span', 'meta-label', label), el('span', look ? `meta-text meta-text--${look}` : 'meta-text', text));
      foot.append(pair);
    }
    return foot;
  }

  function item(entry, slotted) {
    const li = el('li', 'item');
    if (typeof entry === 'string') li.append(el('p', 'text', entry));
    else if (entry.passage) li.append(passage(entry.passage));
    else if (entry.card) li.append(compact(entry.card, { openable: true, nested: true }));
    else if (entry.option) li.append(option(entry.option));
    else if (entry.slot) li.append(...slotted(entry.slot));
    return li;
  }

  // A fold, labelled with how much it holds.
  function fold({ label, items = [] }, open, slotted) {
    const details = el('details', 'fold');
    details.open = open;
    details.dataset.label = label;
    const list = el('ul', 'items');
    list.append(...items.map((entry) => item(entry, slotted)));
    const count = items.some((entry) => entry.slot) ? '' : ` · ${items.length}`;
    details.append(el('summary', null, `${label}${count}`), list);
    return details;
  }

  class SbDiscoveryCard extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['variant', 'openable'];

    constructor() {
      super();
      this._card = null;
      this._highlight = [];
      this._slots = new Map();   // slotted children by slot name, kept while the card redraws
      this._opened = new Set();  // folds the viewer opened, by label, kept when the card is set again
      this._pointed = null;
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('pointerover', (e) => this._point(e.target));
      this.addEventListener('pointerleave', () => this._point(null));
      this.addEventListener('focusin', (e) => this._point(e.target));
      this.addEventListener('focusout', () => this._point(null));
      this.addEventListener('toggle', (e) => this._remember(e.target), true);
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-discovery-card');
      this.render();
    }

    attributeChangedCallback() {
      this.render();
    }

    // ---- Public API ----

    // { id, kind, byline, status, badges: [{ text, tone, title }], text, notes, file, format,
    //   marks, strips: [{ tone, label, text }], folds: [{ label, items }],
    //   created, by, iteration, meta: [{ label, text }] }
    get card() { return this._card; }
    set card(value) {
      this._card = value;
      this.render();
    }

    // `compact` on a board, `normal` (the default), or `expanded` near full screen. A source is
    // always compact.
    get variant() { return this.getAttribute('variant') || 'normal'; }
    set variant(name) { this.setAttribute('variant', name); }

    get openable() { return this.hasAttribute('openable'); }
    set openable(on) { this.toggleAttribute('openable', Boolean(on)); }

    // Refs to light up: the card's own id lights the card; any other lights the compact cards, passages
    // and options in its folds that carry it.
    get highlight() { return this._highlight; }
    set highlight(refs) {
      this._highlight = refs || [];
      this._light();
    }

    // ---- Drawing ----

    render() {
      if (!this.isConnected) return;
      this._keepSlotted();
      const card = this._card;
      this.classList.toggle('sb-discovery-card--expanded', this.variant === 'expanded');
      for (const name of ['ref', 'kind', 'status']) delete this.dataset[name];
      if (!card) {
        this.replaceChildren();
        return;
      }
      Object.assign(this.dataset, { ref: card.id, kind: card.kind }, card.status && { status: card.status });
      // A source is only ever compact: shown in full, it's the source itself, which the sandbox
      // opens in its own view (see the domain discovery practice).
      const isCompact = this.variant === 'compact' || card.kind === 'source';
      this.replaceChildren(isCompact ? compact(card, { openable: this.openable }) : this._full(card));
      this._light();
    }

    // The full card: a header band, then strips saying what it means, then folds holding what it
    // rests on. Expanded, every fold opens, beside the strips when there are any folds.
    _full(card) {
      const expanded = this.variant === 'expanded';
      const article = el('article', 'card');
      article.dataset.kind = card.kind;
      const head = el('header', 'head');
      const badges = el('span', 'badges');
      badges.append(...(card.badges ?? []).map(badge));
      if (card.status) badges.append(status(card.status));
      head.append(icon(card), el('span', 'id', card.id));
      if (card.byline) head.append(el('span', 'byline', card.byline));
      head.append(badges);
      const slotted = (name) => this._slots.get(name) ?? [];
      const strips = (card.strips ?? []).map(strip);
      const folds = (card.folds ?? []).map((f) => fold(f, expanded || this._opened.has(f.label), slotted));
      const split = expanded && folds.length > 0;
      const body = el('div', split ? 'body body--split' : 'body');
      if (split) {
        const main = el('div', 'column'), side = el('div', 'column');
        main.append(...strips);
        side.append(...folds);
        body.append(main, side);
      } else {
        body.append(...strips, ...folds);
      }
      article.append(head, body);
      const foot = footer(card);
      if (foot) article.append(foot);
      return article;
    }

    // Children marked slot="…" are taken in once and placed wherever a fold names their slot.
    _keepSlotted() {
      for (const child of [...this.children]) {
        if (!child.slot) continue;
        if (!this._slots.has(child.slot)) this._slots.set(child.slot, []);
        this._slots.get(child.slot).push(child);
        child.remove();
      }
    }

    _light() {
      const lit = new Set(this._highlight);
      this.classList.toggle('sb-discovery-card--highlighted', Boolean(this._card) && lit.has(this._card.id));
      for (const part of this.querySelectorAll('.sb-discovery-card__item > [data-ref]')) {
        part.classList.toggle('sb-discovery-card__part--highlighted', lit.has(part.dataset.ref));
      }
    }

    // ---- Viewers ----

    _click(e) {
      const opener = e.target.closest('[data-open]');
      if (!opener || !this.contains(opener)) return;
      const detail = { ref: opener.dataset.open };
      if (opener.dataset.quote) detail.quote = opener.dataset.quote;
      this.dispatchEvent(new CustomEvent('sb-open', { bubbles: true, detail }));
    }

    // Pointing announces the page-wide sb-highlight: a passage its source, a compact card its own,
    // anywhere else the card itself.
    _point(target) {
      const found = target?.closest?.('[data-ref]');
      const ref = found && this.contains(found) ? found.dataset.ref : null;
      if (ref === this._pointed) return;
      this._pointed = ref;
      document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref } }));
    }

    _remember(details) {
      if (!details.classList?.contains('sb-discovery-card__fold') || this.variant === 'expanded') return;
      if (details.open) this._opened.add(details.dataset.label);
      else this._opened.delete(details.dataset.label);
    }
  }

  customElements.define('sb-discovery-card', SbDiscoveryCard);
})();
