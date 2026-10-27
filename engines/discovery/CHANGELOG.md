# discovery changelog

## 0.3.2 · 2026-10-27
- Weighing follows superseded excerpts: a claim citing an excerpt that has been replaced by an iteration is weighed on the replacement instead, its passage saying which it `replaces`, and an excerpt reached twice counts once. Before, the wrong excerpt kept counting, and citing the correction beside it counted both.

## 0.3.1 · 2026-10-27
- Takes tags, declared once with what each means (`tags: [{ tag, means }]`), carried by any source, excerpt or record (`tags: [...]`). `tags()` gives every tag with what it means and what carries it, and names those in use but never declared.

## 0.3.0 · 2026-10-26
- **Breaking:** records cite excerpts, not sources and their words. An excerpt is a piece of one source picked out as a record of its own (`excerpts: [{ id: 'SRC-2.3', source: 'SRC-2', iteration, quote }]`, or `page`, `region`, `rows`), and links run source → excerpt → what cites it. To migrate, give each quoted piece of a source an excerpt, then cite its id: a claim's assertion `'SRC-2': ['+', 'the words']` becomes `'SRC-2.3': '+'`; `raisedBy`, `setIn`, `at` and `said` become an excerpt id; a question's `answers` and a record's `sources` become lists of excerpt ids. `inputsOf` returns `{ material, records }`, its material being sources and excerpts. Passages carry their `excerpt`.
- `excerptsOf(id)` gives every excerpt a record rests on, all the way back.

## 0.2.4 · 2026-10-26
- Follows what replaces what: any record can name those it `supersedes`, which then read `superseded`, link to it (`replaced by`) and come back in its iteration. A scenario or rule without code is followed like any record, rather than failing; the model answers only to tests with code that haven't been replaced. `standing(k)` gives everything standing by an iteration, for a board following it all rather than what the iteration changed. Feedback can be `about` several records. A source founds the parts and tests founded on it.

## 0.2.3 · 2026-10-25
- Takes feedback: a comment on the model, voiced in a source, saying it works or is wrong, with its status worked out (`open`, `answered` once something is founded on it, `declined`). A source that speaks to what should be `says it should` of a claim, rather than supporting it, since it isn't counted.

## 0.2.2 · 2026-10-25
- Every link says what it means (`means`: `supports`, `founds`, `meets`, …), in `links()` and `iteration(k)`, so a sandbox no longer works it out to label its boards.

## 0.2.1 · 2026-10-25
- Counting a class's decisions no longer runs its getters, which threw without an object to run on.

## 0.2.0 · 2026-10-25
- Runs the model being built. `createDiscovery` takes `model: { versions, candidates }` and works out a run for each: `runs()`, `run(id)` (the tests met, the change against what it's set against, of what kind, and whether a trial earns its place), `model(k)` (its parts, classes by name, and the compression signal), `results(id)`, `exercisedBy(id)`, `decisionsIn(cls)`, `partOfClass`, `primitivesOf` and `definitionOf`. `status` gives a part's stage and whether a scenario or rule is met. Runs are records, and link like any other.
- Breaking: `also` is gone. Hand the engine `model: { versions, candidates }` in its place.

## 0.1.2 · 2026-10-25
- Knows what rests on what: `links()`, from one table of what each kind's fields point at, `inputsOf(id)`, `appearances(id)`, and `iteration(k)`, what an iteration shows (each card raised, updated or carried) and the links among them. Takes every kind of record, and `also`, what only the sandbox's model knows until the engine does.

## 0.1.1 · 2026-10-25
- Works out every status that follows from the records, as of any iteration: `status(id)` for questions, assumptions, inferences, predictions, investigations, experiments, actions, decisions and outcomes, and `reviewReasons(decisionId)` saying why a decision needs another look, as data. `createDiscovery` takes each kind's records.

## 0.1.0 · 2026-10-25
- First release. Weighs claims, from each source's authored grade (1 to 5, with its reason; ungraded weighs 3, and says so): which passages count, with a copy counted as the source it copies and a source saying what should be shown but not counted; a claim's standing, score and basis, as of any iteration; its passages in order, each saying whether it counts and why not.
