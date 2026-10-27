# How the engine is built

A guide to `index.html` for whoever works on it next: how it's organised, how data flows from records to what's drawn, and how to add things. The ideas are in `README.md`; this is the code. Line numbers drift, so look things up by name.

## The page, top to bottom

1. **Styles:** the flow, the board's folded columns (through `sb-discovery-card`'s classes), the prototype and the object view. Theme tokens with fallbacks throughout.
2. **Markup:**
   - the iteration stepper and the board toggles;
   - the flow;
   - Find a card (`sb-search#finder`, with the tags' meanings in a fold);
   - the prototype section (`sb-scrubber#afternoon`, the board, `sb-outliner#objects`);
   - the versions mock-up (`sb-chart`s, `sb-table#versions-table`);
   - three modals: `#card-modal`, `#source-modal` (holding `sb-source#source-view`) and `#object-modal` (`size="full"`).
3. **Sources and records,** the only things written by hand:
   - **the sources:** `SOURCES`, the catalogue, in the page, each with its authored `grade`, what it `speaksTo` and the `iteration` it arrived in;
   - **the records,** in `records/`, one script per kind, loaded before the page's script: `tags.js` (every tag, declared with what it means), `excerpts.js` (the pieces of sources the others cite, by code), `claims.js`, `questions.js`, `decisions.js` and the rest, `awaited.js`, and for the model `entities.js`, `primitives.js`, `scenarios.js` and `rules.js`. Each record carries `created`, `by` and `iteration`.
4. **The model:**
   - classes `Delay`, `Platform`, `ClockTime`, `Train`, `Board`, `BoardWithPlatformChanges` and `Announcement`;
   - versions: `MODEL` and `CANDIDATES`, handed to the engine, which works out the runs;
   - proposals: `ENTITIES` and `PRIMITIVES`.
5. **Tests and the afternoon:**
   - the afternoon's data: `AFTERNOON` (for rules), `TIMETABLE` and `FEED` (for the prototype);
   - the tests: `SCENARIOS` and `RULES`;
   - the mock-up: `VERSIONS_MOCKUP` and `compressionScore`.
6. **Source texts:** `SOURCE_TEXT` (inline, because a page opened from disk can't read files) and `STILLS`, drawn as SVG.
7. **Working things out:**
   - **claims:** weighed by the discovery engine (`engines/discovery`): `discovery()` makes it from the sources and claims, `weighed(claim, k)` asks it how a claim stood as of an iteration;
   - **derived statuses:** the engine's too: `statusOf(item, k)` asks it for any record's status, and `reviewReasons(decision, k)` puts its reasons for reviewing a decision into words. So is a part's stage and whether a test is met;
   - **the model:** the engine's too: `model(k)` (its parts, classes by name, decisions and busiest method), `runs()` and `runOf(id)` (what each run found, and the change it made), `trialOf(part, k)`, and `trialVerdict(change)`, which puts a trial into words. Test results, what each test exercised, a part's primitives and definition, and the decisions in a class are asked for where they're shown (`discovery().results`, `exercisedBy`, `primitivesOf`, `definitionOf`, `decisionsIn`).
8. **Card helpers,** which prepare a card's data for `sb-discovery-card` and draw nothing: `cardHead`, `strip`, `statusBadge`, `facet`, `fold`, `viewFold` (a fold holding a component, slotted in), `sources`, `cite`, `passage`, `assertionItem`, `basisBadge`, `scoreBadge`, and `card`, which adds the iteration the card was raised in. Plus `el`, and `icon` for the object view.
9. **Card builders:** one per kind, `claimCard(item, k)` … `riskCard(item)`, each returning the card's data, and `cardOf(id, k)`, which dispatches on the prefix.
10. **Boards and iterations:**
    - kinds and boards: the prefix lists (`KNOWING`, `PARTS`, `TESTS`, `BUILDING`, `DIRECTION`) and `BOARDS`;
    - links: the engine's (`links()` asks it), the model's included;
    - iterations: `ITERATIONS` (their titles), `iterationOf` (read from the record), `itemOf`;
    - everything standing: a board marked `whole` (Scenarios) asks the engine's `standing(k)` instead of `iteration(k)`;
    - drawing them: `asOf(id, k)` (a card's face as of an iteration), `faceOf` (its compact data), `drawCard` (any card, in a variant, with its slots), `nodeCard`, `ORDER` (the order cards stand in their columns) and `drawFlow`, which asks the engine what the iteration shows and gives the page's one `sb-lineage` its cards, columns and links.
11. **Finding a card:** `drawFinder` hands `sb-search` everything raised by the iteration shown, as it stood, with its tags, drawn in the grid as compact cards (`drawItem`); `showFound` shows the chosen card with what its tags mean; `drawTagKey` lists every tag from the engine's `tags()`.
12. **The prototype and object view:** `drawPrototype`, `showObject`, and one function per tab (`nowView`, `codeView`, `relationsView`, `overTimeView`, `constraintsView`, `valuesSeenView`, `testedByView`, `definitionView`, `provenanceView`/`provenanceItems`), plus `wirePrototype`.
13. **Links on the board:** labelled with what the engine says each means, and toned by `toneOfLink` (its tone, as the domain discovery practice gives it). Routing, lighting chains and folding are the board's.
14. **Opening and pointing:** `openCard` (expanded, in a modal) and `openSource` (with `citationsOf`); `wireCards` answers every card's `sb-open` and routes `sb-highlight` to every card.

## How data flows

```
sources + records + model classes
   │
   └─ the discovery engine (engines/discovery), handed the model's versions and candidates
        ├─ weigh(claim, k), status(id, k), reviewReasons(decision, k)
        ├─ model(k), runs(), run(id)   the model, every run against every test, and the compression signal
        ├─ links()          every link, from what something rests on to what rests on it
        └─ iteration(k)     the cards it shows (raised, updated or carried) and the links among them
             │
             └─ drawFlow()  orders the cards, sorts them into columns by BOARDS[…].holds(id, k), gives each
                            its face as of the iteration it stands in (asOf), and hands sb-lineage
                            compact cards (nodeCard), columns and labelled links
```

Opening a card calls `cardOf(id, shown.iteration)`, which calls the kind's builder with `k`, so the full card is shown as of the iteration on screen.

**Nothing is stored that can be worked out.** Statuses, links, columns, runs, Tested by and every object view tab are functions of the records and the model. If you find yourself writing a status into a record, derive it instead. Records hold only what someone said, saw or decided.

## Record shapes, by example

Copy the nearest existing record. The shapes that matter most:

- **Source:** `{ id, iteration, name, title, summary, path, format, asOf, role, speaksTo?, grade: { value, why, aspects? }, copies?, derivedFrom?, gatheredBy? }`. `speaksTo: 'what should be'` for plans and decisions.
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

1. Add its record to the kind's script in `records/`, with `created`, `by` and the `iteration` it was raised in.
2. Make sure what it rests on is in its record, under the field the engine reads for that kind (see its manifest). That's all: it appears on the right board, in the right column, linked.

### A source

1. Add it to `SOURCES`, with its text in `SOURCE_TEXT`.
2. Give it the `iteration` it arrived in, and an authored `grade` with its reason.
3. Cite it from cards' assertions or `setIn`. Claims are re-weighed automatically.

### A new kind of card

First check it earns its place (principle 5), and ask the author.

1. Add a script for its records in `records/`, load it in the page, and give it a prefix.
2. Add the prefix to the right list (`KNOWING`, `DIRECTION` or `BUILDING`), and give it a column in `BOARDS` if none fits.
3. Teach the engine what it rests on and, if it has one, its status rule (an engine change, versioned); and `itemOf()`, `ORDER` and `asOf()` here.
4. Give the kind its icon and tone, and any new status words their tone, in `sb-discovery-card` (a component change, versioned), and add it to the domain discovery practice.
5. Write a `kindCard(item, k)` builder returning the card's data, and add it to `cardOf`.
6. If anything new should bring a card back in a later iteration, teach the engine (or, for the model, `modelAppearances`).


### An iteration

1. Add its title to `ITERATIONS`, and give the sources that arrived and the records raised in it that `iteration`.
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

Add a scenario or rule, founded on cards, written against `M` (classes by name). Build trains with `trainFor(M, { … })`, so tests stay plain. Give it the `iteration` it arises in. It runs against every version from then on. Met on arrival is worked out from it.

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
