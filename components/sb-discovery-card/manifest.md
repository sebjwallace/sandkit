# sb-discovery-card

One card of domain discovery: a source, a claim made from it, a question still open, a decision and its options, a part of the model, a test, a run. Each kind has its own icon and tone, so many cards read at a glance. Read the [domain discovery practice](../../practices/domain-discovery.md) first: it says what each kind is for.

The card knows the kinds of discovery and nothing else. It works nothing out: the sandbox decides every status, score and link, and the card draws what it's given.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-discovery-card/sb-discovery-card.js"></script>

<sb-discovery-card variant="compact" openable></sb-discovery-card>

<script>
  const card = document.querySelector('sb-discovery-card');
  card.card = {
    id: 'CLM-1', kind: 'claim', status: 'contested',
    byline: 'Raised by the river trust',
    badges: [{ text: 'observed', title: 'Basis' }, { text: '+3', tone: 'warn', title: 'Score' }],
    text: 'Otters have left the upper Teme.',
    strips: [{ tone: 'main', label: 'Claim', text: 'Otters have left the upper Teme.' }],
    folds: [{ label: 'Sources', items: [{ passage: { source: 'SRC-1', stance: '+', quote: 'spraint at 4 of 18 sites' } }] }],
    created: '2026-03-05T14:20', by: 'Agent', iteration: 1
  };
  card.addEventListener('sb-open', (e) => open(e.detail.ref, e.detail.quote));
</script>
```

## Card

`id` and `kind` are required; the rest is optional. The practice asks every card for `created`, `by` and `iteration`.

| Field | Meaning |
|---|---|
| `id` | The card's code, such as `CLM-1`. Shown, and carried as `data-ref` on the element. |
| `kind` | One of the kinds below: its icon and tone. An unknown kind gets a plain icon. |
| `title` | A few words after the code: a name for the card, or its kind spelt out. |
| `status` | The status word the sandbox worked out, such as `corroborated`, toned by the word (below). |
| `byline` | Where it came from: "Raised by…", "Decided by…". |
| `badges` | `[{ text, tone?, title? }]` beside the status: a basis, a score, a stance. |
| `text` | The few words a compact card shows, clamped to three lines. |
| `notes` | Short lines under a compact card's words: "carried from iteration 1". |
| `file` | The card's file in the sandbox, such as `claims/CLM-1.md`. |
| `format` | For a source: `document`, `notes`, `data`, `image`, `web` or `analysis`. |
| `excerpt` | For an excerpt: `{ source, quote?, page?, image?, region?, rows?, columns? }`. Shows the words (with the page, for a PDF), the `region` of the `image` (`[x, y, width, height]` as fractions), or the `rows` of data under their `columns`. It never fetches: an image loads as any image does. |
| `marks` | For a compact card: `assumed` (a dashed warning edge), `carried` (no fill), `awaited` (dashed and quiet). |
| `strips` | `[{ tone, label, text }]`: what the card means, in order. |
| `folds` | `[{ label, items }]`: what it rests on or holds, after the strips. |
| `created`, `by`, `iteration` | When (`yyyy-mm-ddThh:mm`, shown as "5 Mar 2026, 14:20"), who (`Agent` or a person), and in which iteration. |
| `meta` | `[{ label, text }]`: anything else worth keeping. |
| `tags` | What the card is about, carried as `data-tags`, so the page lights what shares a tag. Only semantic tags: `working` is never read. |
| `scope`, `definitions`, `articles`, `schedules`, `parties` | For a contract: see "Contracts", below. |

**Strip tones:** `main` (the headline), `note` (supporting facts), `answer` (what resolves or holds), `warn` (what's wrong or against), `expect` (what's expected, dashed), `unresolved` (what's still missing, dashed and quiet).

**Fold items,** any mix of:

| Item | Shows |
|---|---|
| `'text'` | A line of text. |
| `{ passage: { excerpt?, source, quote?, stance?, note?, tags? } }` | Source material on paper: `stance` `+`, `-` or `?`, the excerpt's code (or the source's), a short `note`, and the words. Carries `data-ref` with the excerpt, or the source, and lights for either. Its `tags` are the excerpt's own. |
| `{ card: { …a card } }` | Another card, compact and openable, with its `data-ref` and `data-tags`. |
| `{ option: { title, pros?, cons?, chosen?, ref? } }` | An option weighed; the chosen one marked, the rest faded. |
| `{ slot: 'name' }` | The card's children marked `slot="name"`, such as a scenario's steps. |

**Kinds.** What we know: `source`, `excerpt`, `investigation`, `observation`, `metric`, `claim`, `definition`, `opinion`, `inference`, `assumption`, `hypothesis`, `problem`, `incident`, `question`, `feedback`, `awaited`. Where we're going: `outcome`, `goal`, `strategy`, `prediction`, `agreement`, `dispute`, `requirement`, `constraint`, `capability`, `contract`, `principle`, `pattern`, `antipattern`, `optimization`, `solution`, `option`, `tradeoff`, `recommendation`, `decision`, `experiment`, `action`, `risk`. What we're building: `entity`, `primitive`, `scenario`, `rule`, `run`.

**Status tones.** Good: corroborated, answered, confirmed, met, integrated, done, borne out, supported, sound, in force, worked, accepted, on track, earns its place, arrived, chosen, improving, followed, applied, solved, resolved, settled, removed, available. Warn: contested, unresolved, trying, in doubt, untested, shaken, partly, review, not yet, open. Bad: refuted, broken, not met, rejected, not borne out, failed, off track, worsening, present. Accent: single source, proposed, under way, planned, to do. Any other word is muted.

## Variants

| `variant` | Draws |
|---|---|
| `compact` | For a board: icon, code, status and words. |
| `normal` (the default) | The whole card, folds closed. |
| `expanded` | In a modal or near full screen: every fold open, beside the strips. |
| `document` | A contract only, written out in full to read cold or print. |

`openable` makes a compact card a button that fires `sb-open`; cards in folds always are. **Source material is always compact,** whatever the variant: in full it's the material itself, which the sandbox shows in its own view.

## Contracts

A contract is its own sheet, with no strips or badges, and compact it sits in a double rule.

- **`scope`:** `[{ label, text }]`, what it covers and leaves out.
- **`definitions`:** `[{ ref?, term, meaning }]`, shown expanded and as a document.
- **`articles`:** `[{ title, note?, clauses: [{ ref?, text, note?, details?, cited? }] }]`, numbered in the order given, so order is priority. A clause with a `ref` opens and lights as a passage does. As a document, it also writes out `details` (`[{ label, text }]`) and `cited` (`[{ quote, from }]`).
- **`schedules`:** `[{ title, note?, clauses }]`, lettered, after the signatures, as a document.
- **`parties`:** `[{ name, signed? }]`, a signature line each, reading "awaiting signature" until `signed` gives its words.

As a document it's black on white whatever the theme, keeps clauses, definitions and signatures whole across pages, and starts each schedule on a new page. To save it as a PDF, the sandbox shows only that card when printing and calls `window.print()`; the [practice](../../practices/domain-discovery.md) says how.

## Properties and events

| Member | Meaning |
|---|---|
| `card` | Get or set the card. Setting it again redraws, keeping the folds the viewer opened. |
| `variant`, `openable` | Mirror the attributes. |
| `highlight` | Refs to light: the card's code lights the card; another lights the passages, cards and options in its folds carrying it. An excerpt also lights for its source's code. Never redraws. |
| `sb-open` event | `{ ref, quote? }`: an openable card, a card in a fold, or a passage was clicked. Bubbles. The sandbox decides what opening means. |
| `sb-highlight` event | `{ ref }`, `{ ref, tags }` or `{ ref: null }`, on `document`: pointing or focus moved to a passage, a card in a fold or the card, or away. The card announces for itself (`data-sb-announces`), and the page-wide script lights its parts. |

Setting properties never fires events.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`. Its own: `--sb-discovery-card-band`, `--sb-discovery-card-paper`, `--sb-discovery-card-tone` (per `[data-kind]`) and `--sb-discovery-card-status` (per `[data-status]`). Materials, as [STYLE.md](../../STYLE.md) describes: a card with a header band, paper for sources and passages, and a ruled sheet for a contract.

Classes start `sb-discovery-card__`, such as `card`, `head`, `strip` (`--main`, `--note`, …), `fold`, `paper`, `option`, `compact` (`--assumed`, `--carried`, `--awaited`), `compact-head`, `icon`, `id` and `contract`. The element carries `data-ref`, `data-kind` and `data-status` as soon as it has a card.

To shrink a compact card to its icon and code, as in a folded column: `.sb-discovery-card__compact > :not(.sb-discovery-card__compact-head), .sb-discovery-card__compact-head > :not(.sb-discovery-card__icon, .sb-discovery-card__id) { display: none; }`.

## Notes

- **Dependencies:** none. **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** openable cards and passages are buttons; folds are `<details>`, opened from the keyboard.
- **Renaming:** if another component on the page is already called `sb-discovery-card`, the console says so. Replace every `sb-discovery-card` in `sb-discovery-card.js` to give this copy a new name.
