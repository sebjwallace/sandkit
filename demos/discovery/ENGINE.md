# How the engine is built

A guide to `index.html` for whoever works on it next: how it's organised, how data flows from records to what's drawn, and how to add things. The ideas are in `README.md`; this is the code. Line numbers drift, so look things up by name.

## The page, top to bottom

1. **Styles:** the source cards, cards on a board (`.flow-node`, folded bands through `sb-discovery-card`'s classes), the flow, the prototype and the object view. Theme tokens with fallbacks throughout.
2. **Markup:**
   - the iteration stepper and the board toggles;
   - the flow;
   - the prototype section (`sb-scrubber#afternoon`, the board, `sb-outliner#objects`);
   - the versions mock-up (`sb-chart`s, `sb-table#versions-table`);
   - the older sections below the boards;
   - three modals: `#card-modal`, `#source-modal` (holding `sb-source#source-view`) and `#object-modal` (`size="full"`).
3. **Records,** the only things written by hand:
   - **What we know:** `SOURCES`, `CLAIMS`, `QUESTIONS`, `INVESTIGATIONS`, `METRICS`, `EXPERIMENTS`, `OBSERVATIONS`, `ASSUMPTIONS`, `INFERENCES`, `DEFINITIONS`, `OPINIONS`;
   - **Where we're going:** `DECISIONS`, `GOALS`, `PREDICTIONS`, `OUTCOMES`, `CONSTRAINTS`, `AGREEMENTS`, `ACTIONS`, `RISKS`;
   - **awaited material:** `AWAITED`.
4. **The model:**
   - classes `Delay`, `Platform`, `ClockTime`, `Train`, `Board`, `BoardWithPlatformChanges` and `Announcement`;
   - versions and runs: `MODEL`, `CANDIDATES` and `RUNS` (derived);
   - proposals: `ENTITIES` and `PRIMITIVES`.
5. **Tests and the afternoon:**
   - the afternoon's data: `AFTERNOON` (for rules), `TIMETABLE` and `FEED` (for the prototype);
   - the tests: `SCENARIOS` and `RULES`;
   - the mock-up: `VERSIONS_MOCKUP` and `compressionScore`.
6. **Source texts:** `SOURCE_TEXT` (inline, because a page opened from disk can't read files) and `STILLS`, drawn as SVG.
7. **Working things out:**
   - **claims:** `GRADES`, `originOf`, `standing`, `basis`, `score`, `claimAsOf`;
   - **derived statuses:** `reviewReasons`/`decisionStatus`, `questionStatus`, `assumptionStatus`, `inferenceStatus`, `predictionStatus`, `partStage`, `investigationStatus`, `experimentStatus`, `actionStatus`, `testStatus`;
   - **compression:** `decisionsIn`, `modelDecisions`, `busiestMethod`, `compare`, `changeKind`, `runResults`;
   - **watched runs:** `watchedRun`, `testsOf`.
8. **Card helpers,** which prepare a card's data for `sb-discovery-card` and draw nothing: `cardHead`, `strip`, `statusBadge`, `facet`, `fold`, `viewFold` (a fold holding a component, slotted in), `sources`, `cite`, `passage`, `assertionItem`, `basisBadge`, `scoreBadge`, and `card`, which adds the card's iteration and file. Plus `el`, and `icon`, `sourceIcon` and `formatBadge` for the source cards and the object view.
9. **Card builders:** one per kind, `claimCard(item, k)` … `riskCard(item)`, each returning the card's data, and `cardOf(id, k)`, which dispatches on the prefix.
10. **Boards and iterations:**
    - kinds and boards: the prefix lists (`KNOWING`, `PARTS`, `TESTS`, `BUILDING`, `DIRECTION`) and `BOARDS`;
    - links: `links()` and `reach()`;
    - files: `FOLDERS` and `fileOf`;
    - iterations: `LATER`, `ITERATIONS`, `iterationOf`, `itemOf`;
    - working out the boards: `inputsOf`, `appearancesOf`, `asOf`, `unrolled()`;
    - drawing them: `faceOf` (a card's compact data from `asOf`), `drawCard` (any card, in a variant, with its slots), `nodeCard`, and `drawFlow`, which gives the page's one `sb-discovery-board` its cards, columns and links.
11. **The prototype and object view:** `drawPrototype`, `showObject`, and one function per tab (`nowView`, `codeView`, `relationsView`, `overTimeView`, `constraintsView`, `valuesSeenView`, `testedByView`, `definitionView`, `provenanceView`/`provenanceItems`), plus `wirePrototype`.
12. **Links on the board:** `relation` (a link's label) and `toneOfLink` (its tone, as the domain discovery practice gives it). Routing, lighting chains and folding are the board's.
13. **Opening and pointing:** `openCard` (expanded, in a modal) and `openSource` (with `citationsOf`); `wireCards` answers every card's `sb-open` and routes `sb-highlight` to every card.

## How data flows

```
records + model classes
   │
   ├─ links()          every [from, to] pair, from what something rests on to what rests on it
   ├─ iterationOf(id)  the iteration a card was raised or a source arrived in
   ├─ inputsOf(id)     what a card is built from: { sources, cards }
   ├─ appearancesOf(id) every iteration it appears in (raised, and each that brought new material)
   ├─ asOf(id, k)      its face as of iteration k: { kind, text, status, note, … }
   │
   └─ unrolled()       every card in every iteration it appears in, as nodes keyed id@k,
                       and the links between them, all downwards
        │
        └─ drawFlow()  picks the shown iteration and board, carries in earlier cards that
                       this iteration's rest on, sorts nodes into columns by BOARDS[…].holds(id, k),
                       hands sb-discovery-board compact cards (nodeCard), columns and labelled links
```

Opening a card calls `cardOf(id, shown.iteration)`, which calls the kind's builder with `k`, so the full card is shown as of the iteration on screen.

**Nothing is stored that can be worked out.** Statuses, links, columns, runs, Tested by and every object view tab are functions of the records and the model. If you find yourself writing a status into a record, derive it instead. Records hold only what someone said, saw or decided.

## Record shapes, by example

Copy the nearest existing record. The shapes that matter most:

- **Source:** `{ id, name, title, summary, path, format, asOf, role: 'record'|'opinion'|'plan'|'decision', grade: { distance, trust, clarity }, copies?, derivedFrom?, gatheredBy? }`.
- **Claim:** `{ id, text, summary, raisedBy, assertions: { 'SRC-n': ['+'|'−', quote] }, informs? }`.
- **Decision:** `{ id, title, status, when, deciders, options: [{ id, title, pros, cons }], chosen, restsOn: [ids], decided, reason, sources: [{ source, quote }] }`.
- **Constraint:** `{ id, text, firmness, status, rulesOut, comesFrom: { cause, text }, protects, setIn: [source, quote], from? }`.
- **Observation:** `{ id, value, of, when, at: [source, quote], metric?, tests?: [id, '+'|'−'], resultOf? }`.
- **Entity or primitive proposal:** `{ id, name, purpose, proposedBy, foundedOn: [ids], rejected?: { in, why } }`.
- **Scenario:** `{ id, title, foundedOn, steps: [{ keyword, text }], play: M => [null | { ok, actual }, …] }`, one result per step.
- **Rule:** `{ id, kind: 'MANDATE'|'CONDITIONAL', title, foundedOn, lines: [{ keyword?, text, depth? }], check: M => [failure descriptions] }`.

`setIn`, `said`, `raisedBy` and `at` are `[sourceId, quote]` pairs: the passage a card rests on.

## How to add…

### A card of an existing kind

1. Add its record to the kind's array.
2. If it was raised in a later iteration, add its id to that iteration's `cards` in `LATER`. Otherwise it falls into iteration 1.
3. Make sure what it rests on is in its record, under the field `links()` and `inputsOf()` read for that kind. That's all: it appears on the right board, in the right column, linked.

### A source

1. Add it to `SOURCES`, with its text in `SOURCE_TEXT`.
2. For a later iteration, add its id to that iteration's `sources`.
3. Cite it from cards' assertions or `setIn`. Claims are re-weighed automatically.

### A new kind of card

First check it earns its place (principle 5), and ask the author.

1. Add the record array and a prefix.
2. Add the prefix to the right list (`KNOWING`, `DIRECTION` or `BUILDING`), and give it a column in `BOARDS` if none fits.
3. Teach `links()`, `inputsOf()`, `itemOf()`, `ITERATIONS`' first-iteration list, `unrolled()`'s id list and `asOf()` about it.
4. Add `FOLDERS[prefix]` for its file.
5. Give the kind its icon and tone, and any new status words their tone, in `sb-discovery-card` (a component change, versioned), and add it to the domain discovery practice.
6. Write a `kindCard(item, k)` builder returning the card's data, and add it to `cardOf`.
7. If anything new should bring a card back in a later iteration, add it to `appearancesOf`.


### An iteration

1. Add an entry to `LATER` with a title, the sources that arrived and the cards raised.
2. If the model changes, add a `MODEL` version with the iteration's number and `changedBy`.
3. Earlier cards reappear by themselves where new material reaches them.

### A version of the model

1. Write the new class. Extend the old one when it's a change to it, as `BoardWithPlatformChanges extends Board` does, so the old version stays intact and reproducible.
2. Add a `MODEL` entry mapping part ids to classes, with `changedBy` naming the card (an action or decision) that changed it.
3. A run is derived for it automatically.

### A candidate (a trial)

1. Write the proposed class.
2. Add the proposal to `ENTITIES` or `PRIMITIVES`, founded on cards. A definition of its name clears the flag.
3. Add a `CANDIDATES` entry: `{ iteration, tries: id, parts: { ...MODEL[i].parts, [id]: Class } }`. It moves to Trying, and a run with a verdict appears.

### A test

Add a scenario or rule, founded on cards, written against `M` (classes by name). Build trains with `trainFor(M, { … })`, so tests stay plain. Write it in the iteration it arises in (add the id to `LATER`'s cards). It runs against every version from then on. Met on arrival is worked out from it.

### A tab in the object view

Write a `somethingView(part, …)` that returns an element derived from the class, instance, model or feed. Add it to the `panels` list in `showObject`. Never write a view's content by hand (principle 10).

## Gotchas found along the way

- **`CSS.escape` is shadowed** inside components that define their own `CSS` constant. Match on `data-…` attributes instead.
- **Class names from part names:** use `asClassName` ("Clock time" → `ClockTime`), not naive capitalising.
- **Planned platforms** come from the timetable (`planned: entry.platform`), never from the feed's change.
- **A decision is under review only when something it rests on changed *after* it was decided.** Grounds that were already bad when it was decided are part of its reasoning.
- **New capability versus a patch:** `compare` returns `inPlace` (decisions added to parts that already existed). A trial adding a new part with nothing in place is new capability.
- **Watched runs construct the real class.** The `Proxy`'s `construct` passes the real target as `newTarget`, so `super` calls and `instanceof` behave. Methods run with the watched object as `this`, so calls inside the model are recorded too.
- **A test the model can't run** (no `Announcement`) fails every step it checks, with the error as what happened, and still records what it touched first.
- **Headless Chrome may not deliver frames.** Check the page in Claude in Chrome via `python3 -m http.server 8765 --bind 127.0.0.1`, cache-busting with `?v=N`, or `fetch(…, { cache: 'reload' })` after editing a component script.
