# sb-discovery-card

One card of domain discovery: a source gathered, a claim made from it, a question still open, a decision taken, a part of the model, a test, a run. Each kind has its own icon and tone, so many cards read at a glance. Read the [domain discovery practice](../../practices/domain-discovery.md) first: it says what each kind is for and how the cards fit together.

The card knows the kinds of discovery, which belong to the method rather than to any subject, and nothing else. It works nothing out: the sandbox decides every status, score and link, as of whichever iteration it shows, and the card draws what it's given.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-discovery-card/sb-discovery-card.js"></script>

<sb-discovery-card variant="compact" openable></sb-discovery-card>

<script>
  const card = document.querySelector('sb-discovery-card');
  card.card = {
    id: 'CLM-1',
    kind: 'claim',
    status: 'contested',
    byline: 'Raised by the river trust',
    badges: [{ text: 'observed', title: 'Basis' }, { text: '+3', tone: 'warn', title: 'Score' }],
    text: 'Otters have left the upper Teme.',
    strips: [{ tone: 'main', label: 'Claim', text: 'Otters have left the upper Teme.' }],
    folds: [{ label: 'Sources', items: [{ passage: { source: 'SRC-1', stance: '+', quote: 'spraint at 4 of 18 sites' } }] }],
    created: '2026-03-05T14:20',
    by: 'Agent',
    iteration: 1,
  };
  card.addEventListener('sb-open', (e) => open(e.detail.ref, e.detail.quote));
</script>
```

## Card

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | The card's code, such as `CLM-1`. Shown, and carried as `data-ref`. |
| `kind` | yes | One of the kinds below. Sets the icon and tone; an unknown kind gets a plain icon. |
| `status` | no | The status word the sandbox worked out, such as `corroborated`. Its tone comes from the word (below). |
| `byline` | no | Where it came from in the world: "Raised by…", "Decided by…". |
| `badges` | no | `[{ text, tone?, title? }]` beside the status: a basis, a score, a stance. Without a tone, a quiet italic pill. |
| `text` | no | The few words a compact card shows, clamped to three lines. |
| `notes` | no | Short lines a compact card shows below its words: "carried from iteration 1". |
| `file` | no | The card's file in the sandbox, such as `claims/CLM-1.md`. |
| `format` | no | For a source: `document`, `notes`, `data`, `image`, `web` or `analysis`, marked on its page icon. |
| `marks` | no | For a compact card: `assumed` (a dashed warning edge), `carried` (no fill), `awaited` (dashed and quiet). |
| `strips` | no | `[{ tone, label, text }]`: what the card means, in order. |
| `folds` | no | `[{ label, items }]`: what it rests on or holds, after the strips. |
| `created` | no | When the card was made, `yyyy-mm-ddThh:mm`, shown as "5 Mar 2026, 14:20"; any other form is shown as given. |
| `by` | no | Who recorded it: `Agent` or a person. |
| `iteration` | no | The iteration it was raised in. |
| `meta` | no | `[{ label, text }]`: anything else worth keeping about the card. |

The practice asks every card for `created`, `by` and `iteration`; the card shows whatever it's given.

**Strip tones:** `main` (the headline: the claim, the question, the name), `note` (supporting facts), `answer` (what resolves or holds), `warn` (what's wrong or against), `expect` (what's expected or compared, dashed), `unresolved` (what's still missing, dashed and quiet).

**Fold items**, any mix of:

| Item | Shows |
|---|---|
| `'text'` | A line of text. |
| `{ passage: { source, quote?, stance?, note? } }` | A passage of source material on paper: `stance` `+`, `-` or `?`, the source's code, a short `note` such as a strength, and the words. Carries `data-ref` with the source. |
| `{ card: { …a card } }` | Another card, drawn compact and openable. Carries `data-ref` with its code. |
| `{ option: { title, pros?, cons?, chosen?, ref? } }` | An option weighed; the chosen one marked, the rest faded. |
| `{ slot: 'name' }` | The card's children marked `slot="name"`, such as a scenario's steps. |

**Kinds.** What we know: `source`, `investigation`, `observation`, `metric`, `claim`, `definition`, `opinion`, `inference`, `assumption`, `question`, `feedback`, `awaited`. Where we're going: `outcome`, `goal`, `prediction`, `agreement`, `constraint`, `decision`, `experiment`, `action`, `risk`. What we're building: `entity`, `primitive`, `scenario`, `rule`, `run`.

**Status tones.** Good: corroborated, answered, confirmed, met, integrated, done, borne out, supported, sound, in force, worked, accepted, on track, earns its place, arrived. Warn: contested, unresolved, trying, in doubt, untested, shaken, partly, review, not yet, open. Bad: refuted, broken, not met, rejected, not borne out, failed, off track. Accent: single source, proposed, under way, planned, to do. Any other word is muted: held, holds, pending, awaited, superseded, unbacked, declined.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `variant` | `normal` | `compact` on a board: icon, code, status and words. `normal`: the whole card, folds closed. `expanded`, in a modal or near full screen: every fold open, beside the strips. |
| `openable` | off | A compact card becomes a button that fires `sb-open`. Cards inside folds are always openable. |

**A source is always compact,** whatever the variant. In full it's the source material itself, which the sandbox shows in its own view; the practice says how.

## Properties

| Member | Meaning |
|---|---|
| `card` | Get or set the card. Setting it again redraws, keeping the folds the viewer opened. |
| `variant`, `openable` | Mirror the attributes. |
| `highlight` | Refs to light: the card's own code lights the card; another lights the passages, cards and options in its folds that carry it. Never redraws. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-open` | `{ ref, quote? }` | An openable compact card, a card in a fold, or a passage (with its `quote`) is clicked. Bubbles. The sandbox decides what opening means. |
| `sb-highlight` | `{ ref }`, `{ ref: null }` | Pointing or focus moves to a passage (its source), a card in a fold, or the card itself, and away. Fired on `document`, as the [highlighting practice](../../practices/highlighting.md) describes. |

Setting properties never fires events.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`. Its own: `--sb-discovery-card-band` (the header and footer bands, from `--sb-surface-2`), `--sb-discovery-card-paper` (the paper's sheet), `--sb-discovery-card-tone` (a kind's tone, set per `[data-kind]`), `--sb-discovery-card-status` (a status's tone, set per `[data-status]`).

Materials, as [STYLE.md](../../STYLE.md) describes: a card with a header band, a record; and paper for sources and passages, with a 12px fold.

Classes: `sb-discovery-card` (`--expanded`, `--highlighted`), `sb-discovery-card__card`, `__head`, `__icon`, `__id`, `__byline`, `__badges`, `__badge`, `__status`, `__format`, `__body` (`--split`), `__column`, `__strip` (`--main`, `--note`, `--answer`, `--warn`, `--expect`, `--unresolved`), `__label`, `__text`, `__fold`, `__items`, `__item`, `__paper`, `__slip`, `__stance`, `__source`, `__passage-note`, `__quote`, `__option` (`--chosen`), `__option-head`, `__option-title`, `__chosen`, `__points`, `__point` (`--pro`, `--con`), `__compact` (`--assumed`, `--carried`, `--awaited`), `__compact-head`, `__compact-text`, `__note`, `__file`, `__foot`, `__meta`, `__meta-label`, `__meta-text`, `__part--highlighted`. The element carries `data-ref`, `data-kind` and `data-status`; compact cards and full cards carry `data-kind` for their tone.

A board that folds a column down can hide everything in a compact card but its icon and code: `.sb-discovery-card__compact > :not(.sb-discovery-card__compact-head), .sb-discovery-card__compact-head > :not(.sb-discovery-card__icon, .sb-discovery-card__id) { display: none; }`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-modal`](../sb-modal/manifest.md),** holding the card expanded when a compact one is opened.
- **[`sb-source`](../sb-source/manifest.md),** for `sb-open` on a source or a passage: open the source, at the passage when there's a `quote`.
- **[`sb-source-trace`](../sb-source-trace/manifest.md),** whose `drawNode` can return a compact card, so a trace looks like the boards.
- **[`sb-outliner`](../sb-outliner/manifest.md),** whose traces the sandbox routes to every card's `highlight`.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** openable cards and passages are buttons; folds are `<details>`, opened from the keyboard.
- **Renaming:** if another component on the page is already called `sb-discovery-card`, the console says so. Replace every `sb-discovery-card` in `sb-discovery-card.js` (tag, classes and style id all use it) to give this copy a new name.
