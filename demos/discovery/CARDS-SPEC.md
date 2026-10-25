# Specification: one card component

How the engine's cards could become one Sandkit component, with variants, staying close to what's already built in `index.html`. This is plan item 15. **It's a proposal for the author to decide, not a settled decision.** Nothing here is built yet.

---

## 1. Extend or new

**New: `sb-card`.** The nearest existing component is `sb-choice`, and it's the wrong home.

- `sb-choice` is one kind of record, a decision, with its own data shape (options, pros and cons, chosen, editing).
- The engine's cards are many kinds sharing one shape: a header, strips, folds.
- Growing `sb-choice` to hold claims, runs and constraints would bury its purpose.

The engine's decision card could stay drawn as `sb-card`, or embed an `sb-choice` through a slot for its options. See §7.

## 2. The constraint that shapes everything: components are domain-agnostic

Sandkit's `DECISIONS.md` says components never name domain concepts; the sandbox maps its domain onto the component's generic shape. So **`sb-card` must not know what a claim, a run or a constraint is.** The 26 kinds stay in the sandbox.

What the component offers instead is a **generic card**, plus **three variants of how it's shown**:

| Variant | Today in the page | What it is |
|---|---|---|
| `face` | `nodeCard()` | The compact face on a board or in a trace: icon, id, status, the clamped text, notes, file path. |
| `card` (default) | `card(cardHead(…), …strips, …folds)` | The full card: a header band, then strips, then folds, closed at first. |
| `open` | `openCard()`'s rearrangement | The card opened in a modal: strips on the left, folds open on the right. |

**The "variant per kind" lives in the sandbox,** as one small table, `KINDS`, mapping each kind to its icon drawing, tone and label (§5). This is what the card builders already do; it just becomes data.

So the author's "one card component with all these different variants" becomes:

- one component;
- three display variants;
- one kind table in the sandbox giving each kind its look;
- per-kind builder functions in the sandbox that turn a domain item into the card's plain data.

The builders are what `claimCard()` and the other card functions already are, minus the DOM.

## 3. Components render; models compute

The page already works this way inside: `asOf(id, k)` and the card builders work out every status, and `card()`, `strip()` and `fold()` only draw. The split becomes the component boundary:

- **The sandbox computes:** standing, score, basis, every derived status, the iteration `k`, what's linked, what's carried in, what changed.
- **`sb-card` draws** exactly the data it's given. It never sorts, counts, weighs or derives.

**Time** (`k`, "as of iteration N") is entirely the sandbox's. The component knows nothing of iterations: the sandbox builds the data as of `k` and sets it again when `k` changes.

## 4. Data shape

```js
card.data = {
  id: 'CLM-2',                       // shown in the id chip; also the card's data-ref
  kind: 'claim',                     // a word: set as data-kind for styling, and the icon's title
  icon: '<path d="…"/>',             // inner SVG for a 16×16 viewBox, stroke-drawn (as ICONS are now)
  tone: 'accent',                    // the icon's tone: accent | good | warn | bad | muted | text
  byline: 'Raised by Agent',         // full card only
  badges: [                          // in the header, in order
    { text: 'observed', look: 'facet', title: 'Basis: what holds it up' },
    { text: 'corroborated', look: 'status', tone: 'good' },
    { text: '+11', look: 'score', tone: 'good' },
  ],
  text: 'Any delay, even a minute, shows an expected time instead of On time.',  // the face's text
  notes: ['updated: new material arrived'],                                     // face only, muted italic
  file: 'claims/CLM-2.md',           // face only, monospace
  marks: ['assumed'],                // face only: assumed (dashed warn edge), carried (no fill), awaited (dashed, muted)
  strips: [                          // full card's body
    { tone: 'main', label: 'Claim', text: '…' },
    { tone: 'note', label: 'Summary', text: '…' },
  ],
  folds: [                           // after the strips; closed in card, open in open
    { label: 'Sources', items: [ … ] },
  ],
};
```

### Strips

These are the six tones the page uses today, kept as they are:

| Tone | Look | Used for |
|---|---|---|
| `main` | accent bar, bold larger text | the card's headline: the claim, the decision, the entity's name |
| `note` | muted bar | supporting facts: summary, purpose, how, counts |
| `answer` | good bar | what resolves or holds: an answer, a result that supports, Met, behaviour |
| `warn` | warn bar | what's wrong or against: a refuting result, Not met, a recommendation against |
| `expect` | accent bar, dashed, lighter | what's expected or compared: "bears it out if", a change, against the model before |
| `unresolved` | warn bar, dashed, muted italic text | what's still missing: not measured yet, no answer yet |

### Fold items

A fold item is one of:

- **Text:** `'list of Train (ENT-1)'`.
- **A passage:** `{ passage: { source: 'SRC-2', quote: '…', mark: '+' | '−', grades } }`. This is drawn as `assertionItem()` draws it now: the quote, its mark, its source's id. Clicking fires `sb-open` with `{ ref: 'SRC-2', quote }`.
- **A card face:** `{ card: { …face data } }`. This is drawn as the `face` variant, the way runs list their tests and entities their Founded on now. Clicking fires `sb-open` with `{ ref: id }`.
- **A slot:** `{ slot: 'options' }`. Whatever the sandbox put in that slot shows here (§7).

## 5. The kinds, as the sandbox's table

The sandbox keeps one table. The icon drawings are today's `ICONS`, and the tones are today's `.card-icon--…` CSS:

| Kind | Tone | Board | Kind | Tone | Board |
|---|---|---|---|---|---|
| source | text (paper) | know | outcome | text | going |
| investigation | accent | know | goal | accent | going |
| observation | text | know | prediction | accent | going |
| metric | accent | know | agreement | accent + good | going |
| claim | accent | know | constraint | accent + bad | going |
| definition | muted | know | decision | good | going |
| opinion | warn + bad | know | experiment | good | going |
| inference | accent | know | action | accent | going |
| assumption | warn | know | risk | bad | going |
| question | warn | know | entity | accent | building |
| awaited | muted, dashed | know | primitive | muted | building |
| run | accent | building | scenario | accent + good | building |
| | | | rule | text | building |

Mixed tones ("accent + bad") are `color-mix` of two theme tokens, as now. The component takes `tone` as one of its named tones, and also any CSS colour expression through `--sb-card-tone`, so the sandbox can mix.

**Status words → tones** is the sandbox's mapping too. Today it's the `.status[data-status=…]` rules. As data, each badge carries its `tone`:

- **good:** corroborated, answered, confirmed, met, integrated, done, borne out, supported, sound, in force, worked, accepted, on track, earns its place.
- **warn:** contested, unresolved, trying, in doubt, untested, shaken, partly, review, not yet.
- **bad:** refuted, broken, not met, rejected, not borne out, failed, off track.
- **accent:** single source, proposed, under way, planned, to do.
- **muted:** held, holds, pending.

## 6. The look, against `STYLE.md`

- **Material:** "card with a header band" means a record. It's what `sb-choice` wears and what the engine's cards already wear: a `--sb-surface-2` band with a border below, over a `--sb-surface` body. `sb-card` wears it too.
- **Paper stays for sources.** A source's face on a board is paper (a warm tint, square-ish corners). Since paper means source material, `sb-card` should *not* draw paper. A source face would be drawn by the sandbox, or by `sb-sources`, through a slot. Alternatively, a `material="paper"` attribute could be added, but that spreads paper beyond the three components that wear it and changes `STYLE.md`'s table. **This needs the author's decision.**
- **Tokens:**
  - `--sb-card-tone` (an icon's tone);
  - `--sb-card-band` (defaults to `--sb-surface-2`);
  - the strip tones from `--sb-good`, `--sb-warn` and `--sb-accent`, with fallbacks;
  - never a bare colour.
- **Classes:** prefixed `sb-card__head`, `sb-card__id`, `sb-card__badge`, `sb-card__strip`, `sb-card__strip--answer`, `sb-card__fold`, `sb-card__face`, and so on.
- **Faces stay small:** text clamped to three lines, so a board of ~20 faces stays readable.

## 7. Slots

Slots let a sandbox put a richer view inside a card without the card knowing what it is:

- **`slot="<name>"` children, placed by a fold item `{ slot: '<name>' }`.** These hold the decision's options (an `sb-choice`, or the sandbox's own list), a scenario's steps (`sb-scenario`), a rule (`sb-rule`), a run's chart, or a source's text (`sb-source`).
- **`slot="badges"`:** extra badges the sandbox draws itself, such as a format pill with its data-format colour.
- **`slot="icon"`:** an icon the sandbox draws, such as source icons with format marks (`sourceIcon()`).

Opened cards today already embed components this way: scenario and rule cards show `sb-scenario` and `sb-rule`.

## 8. Events and highlighting

- **`sb-open`** `{ ref, quote? }`, bubbling, when a face, a fold's card face or a passage is clicked. The sandbox decides what opening means (a modal, a source at a passage). This replaces the inline `openCard` and `openSource` wiring.
- **`sb-highlight`**, Sandkit's standard event, on hover and focus, with the card's `ref`, so boards, traces and the outliner can light chains. A `lit` attribute or property lights a card from outside.
- **`data-ref`** on the root, per `DECISIONS.md` ("the sandbox's own parts take part as components do").
- **Setting `data` never fires events.**

## 9. Variant details

- **`face`** is a `<button>` when the sandbox listens for opening (attribute `openable`), otherwise a span. It shows: icon, id (or a word in its place, such as "awaited"), the first status badge, the slotted badges, the text, notes, file. A folded column hides everything but the icon and id; that's the board's CSS, using the classes above.
- **`card`** shows: header (icon, id, byline, badges), body (strips, then folds closed, each labelled "Label · count").
- **`open`** shows: header, then two columns, with strips (and any `in-main` items) on the left and every fold open on the right. It collapses to one column on a phone.

## 10. Migrating the page

Small steps, each shown in the browser:

1. **Write `KINDS`** in the page: kind → icon, tone, label. Make `icon()` read it. No visible change.
2. **Turn one builder into data,** say `observationCard(o)` → `observationData(o)`, returning the §4 shape, with a page-local `drawCard(data, variant)` drawing it with today's helpers. Repeat kind by kind. Still no visible change.
3. **Fold `nodeCard()` into `drawCard(…, 'face')`,** and `openCard()`'s rearrangement into `'open'`.
4. **Lift `drawCard` into `components/sb-card/`:** script, manifest, changelog, `test.html` (two instances, text never rendered as markup), `demo.html` (About, then Examples in two contrasting domains, none retail: say a rail incident log and a river survey). Add it to `CATALOG.md`, the collisions and isolation tests, `DECISIONS.md` and the root changelog's count.
5. **Swap the page** to `<sb-card>`. `sb-source-trace`'s `drawNode` returns an `<sb-card variant="face">`.

Steps 1 to 3 are demo-only, with no tests. Step 4 is a new component, so it gets its own tests and the collisions and isolation runs.

## 11. The domain object view, as components

The object view (prototype → double-click) is a second family, built the same way. The planned names are `sb-entity` and `sb-primitive`; perhaps it's one `sb-object` with a `kind`, decided by extend-or-new at the time.

- **What it owns:** a head (icon, part id, name, class name) and tabs.
- **What it takes through slots:** each tab's view, as `slot="now"`, `slot="code"`, `slot="relations"`, `slot="over-time"`, `slot="constraints"`, `slot="values-seen"`, `slot="tested-by"`, `slot="definition"` and `slot="provenance"`. Each child is whatever component the sandbox composes: `sb-json`, `sb-code`, `sb-erd`, `sb-timeline`, `sb-rule`, `sb-bars`, `sb-callout`, `sb-source-trace`.
- **What it remembers:** the chosen tab per kind (the page does this now with `prototype.tabs`).
- **What it knows:** nothing about the model. Every view is derived by the sandbox (principle 10). The component only frames them.

"Entity" and "primitive" are modelling words rather than a domain's. Check with the author that they pass the domain-agnostic rule.

## 12. Open questions for the author

1. **`sb-card`** as the name? `sb-record` is an alternative that echoes the material.
2. **Should source faces be paper inside `sb-card`?** That needs a `STYLE.md` change. Or should they come in through a slot?
3. **Does the decision card embed `sb-choice`, or stay generic strips?**
4. **When:** after the kinds settle. Events (item 2) and supersedes (item 4) will add a kind and a mark. A struck-through "superseded" face is a likely fifth mark.
