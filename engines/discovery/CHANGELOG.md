# discovery changelog

## 0.2.0 · 2026-10-25
- Runs the model being built. `createDiscovery` takes `model: { versions, candidates }` and works out a run for each: `runs()`, `run(id)` (the tests met, the change against what it's set against, of what kind, and whether a trial earns its place), `model(k)` (its parts, classes by name, and the compression signal), `results(id)`, `exercisedBy(id)`, `decisionsIn(cls)`, `partOfClass`, `primitivesOf` and `definitionOf`. `status` gives a part's stage and whether a scenario or rule is met. Runs are records, and link like any other.
- Breaking: `also` is gone. Hand the engine `model: { versions, candidates }` in its place.

## 0.1.2 · 2026-10-25
- Knows what rests on what: `links()`, from one table of what each kind's fields point at, `inputsOf(id)`, `appearances(id)`, and `iteration(k)`, what an iteration shows (each card raised, updated or carried) and the links among them. Takes every kind of record, and `also`, what only the sandbox's model knows until the engine does.

## 0.1.1 · 2026-10-25
- Works out every status that follows from the records, as of any iteration: `status(id)` for questions, assumptions, inferences, predictions, investigations, experiments, actions, decisions and outcomes, and `reviewReasons(decisionId)` saying why a decision needs another look, as data. `createDiscovery` takes each kind's records.

## 0.1.0 · 2026-10-25
- First release. Weighs claims, from each source's authored grade (1 to 5, with its reason; ungraded weighs 3, and says so): which passages count, with a copy counted as the source it copies and a source saying what should be shown but not counted; a claim's standing, score and basis, as of any iteration; its passages in order, each saying whether it counts and why not.
