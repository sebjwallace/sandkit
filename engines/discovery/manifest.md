# discovery

The engine of domain discovery: the method's rules, written once. Give it the sandbox's records and it works out what follows from them, the same way every time, so a record holds only what someone wrote and never a conclusion. Read the [domain discovery practice](../../practices/domain-discovery.md) first: it says what records there are and where they're kept.

It draws nothing and knows no component; the practice says how a sandbox shows what it works out.

It weighs claims, works out every status that follows from the records, knows what rests on what (the links between records, and what each iteration shows), and runs the model being built against every scenario and rule.

Use this engine through the interface below. You don't need to read its source.

## Usage

In a page, as a classic script, beside the records it reads:

```html
<script src="lib/sandkit/engines/discovery/discovery.js"></script>
<script src="records/claims.js"></script>

<script>
  const discovery = createDiscovery({ sources, claims, questions, decisions /* , … */ });
  const weighed = discovery.weigh('CLM-3', { asOf: 2, reliedOn: true });
  // weighed.standing → 'contested', weighed.score → -7, weighed.basis → 'reported'
  discovery.status('DEC-1', { asOf: 2 });          // → 'review'
  discovery.reviewReasons('DEC-1', { asOf: 2 });   // → [{ ref: 'ASM-1', now: 'refuted', why: 'rests on' }]
  discovery.iteration(2);                          // → { cards: [{ id: 'CLM-3', as: 'updated' }, …], links: [{ from, to }, …] }
  discovery.run('RUN-3').change.earnsItsPlace;     // → true
</script>
```

In Node, for tests and tools:

```js
const { createDiscovery } = require('./lib/sandkit/engines/discovery/discovery.js');
```

## What it takes

`createDiscovery({ sources, claims, questions, assumptions, inferences, observations, predictions, outcomes, investigations, experiments, actions, decisions, goals, metrics, definitions, opinions, feedback, agreements, constraints, risks, awaited, entities, primitives, scenarios, rules, model })`. Give it the kinds the sandbox has; any left out is empty. Each list is plain records, each saying the `iteration` it was raised in; the engine never changes them.

**A source**, as discovery weighs it, from its entry in the catalogue (see the [sources practice](../../practices/sources.md)):

| Field | Meaning |
|---|---|
| `id` | Its code, such as `SRC-2`. |
| `grade` | `{ value, why, aspects? }`, authored by whoever catalogued it: `value` from 1 (weak) to 5 (strong), with 3 ordinary; `why`, the reason; `aspects`, any dimensions that matter here. A source not graded yet weighs 3, and its passages say so. |
| `speaksTo` | `how things are` (the default), which is counted; or `what should be`, such as a plan, a manual or a policy, which shows but isn't counted: what should happen is no evidence of what does. |
| `format` | `data` or `image` make a claim's basis observed. |
| `copies` | The source it repeats, if any: it's counted as that one. |
| `derivedFrom` | Set when it's drawn from another source, such as a summary: backing only from these makes a basis inferred. |
| `iteration` | The iteration it arrived in. Without one, it has always been there. |

**A claim**: `{ id, assertions: { 'SRC-2': ['+' or '−', 'the words'], … } }`, plus whatever else its record holds. A no can be written `'−'` or `'-'`.

**The other records**, and the fields their statuses read:

| Kind | Reads |
|---|---|
| question | `answer` (written up) and `answers: { sourceId: 'the words' }` |
| assumption | the observations testing it |
| observation | `tests: [id, '+' or '−']`, a verdict on an assumption or a prediction; `resultOf`, the experiment it's a result of |
| inference | `premises: [id, …]` |
| prediction | `from`, the decision that made it; the outcomes `against` it |
| outcome | `against`, `result`: `worked`, `partly` or `failed` |
| investigation | the sources whose `gatheredBy` names it |
| experiment | the observations whose `resultOf` names it |
| action | `status`, as written, and `done`, the source or record showing it's done |
| decision | `status`, as written, and `restsOn: [id, …]` |
| feedback | `said: [sourceId, 'the words']`, `about` (what it's about), `verdict` (`works` or `wrong`), `declined` (the reason, when not acted on), and the records founded on it |

**What each kind rests on,** which makes the links: a claim on its passages' sources, and it informs questions (`informs`); a question on the source raising it (`raisedBy`) and those answering it; a decision on `restsOn` and its cited `sources`; an action and a risk on what brought them about (`from`) and their sources; a prediction and an experiment on `from`, an experiment also on its source (`setIn`); a goal, assumption, definition, agreement and constraint on the source setting them (`setIn`, `said` for an opinion), an agreement or constraint also on `from`; an inference on its `premises`; an observation on the source it was read from (`at`), and it bears on what it `tests`, its experiment (`resultOf`) and its `metric`; an outcome on `from` and its sources, and it bears on what it's measured `against`; an investigation on what prompted it (`prompt`), and a source on the investigation that gathered it (`gatheredBy`); entities, primitives, scenarios and rules on what they're `foundedOn`; awaited material on what it's `for`; feedback on the source it was `said` in, and it bears on what it's `about`.

**The model**, `model: { versions, candidates }`, the classes the sandbox writes, handed in since the engine can't know them:

| Field | Meaning |
|---|---|
| `versions` | One per iteration that changed it, oldest first: `{ iteration, parts: { 'ENT-1': Train, 'PRM-1': Delay, … } }`, each part's id to its class. Every version is kept, so every run can be repeated. |
| `candidates` | Proposals tried beside the model: `{ iteration, tries: 'ENT-4', parts }`, the model it would join with the part added. |

The parts, scenarios and rules it reads:

| Kind | Reads |
|---|---|
| entity, primitive | `name`, which names its class for tests (`clock time` is `ClockTime`); `rejected: { in, why }` once turned down; an entity's class may list `static properties`, naming the classes of the primitives it's made of |
| scenario | `steps: [{ keyword, text }]`; `play(M)`, given the model's classes by name, returning each step's result, `null` for a step not checked, else `{ ok, actual }` |
| rule | `check(M)`, returning the cases it fails for, in words; none when it holds |

**What the model adds to the links:** each version and candidate is a run, `RUN-1` onwards (versions first), resting on the parts it changed. An entity rests on its primitives. A part comes back in an iteration where its class or its stage changes; a test where what it says against the model does. The runs of an iteration that say something about a test link to it there: the model's own run, and a trial's where it newly meets it.

## What it works out

| Member | Gives |
|---|---|
| `weigh(claim, { asOf?, reliedOn? })` | A claim, by its id or as a record, weighed on the sources that had arrived by iteration `asOf` (every source by default). `reliedOn`: whether anything rests on it, which tells an assumption from a conjecture when nothing backs it. Returns `{ standing, score, basis, passages }`. |
| `strength(sourceId)` | A source's grade's value, 1 to 5; 3 when it isn't graded yet. |
| `originOf(sourceId)` | The source it copies, all the way back, or itself. |
| `links()` | Every link, `{ from, to, means }`, from what something rests on to what rests on it, each once. `means` says what it means, in words (below). |
| `inputsOf(id)` | What a record rests on: `{ sources, records }`. |
| `appearances(id)` | The iterations it appears in: the one it was raised in, each later one bringing new material for it, and, for decisions, goals, predictions, experiments, metrics, assumptions and inferences, each one bringing back what they rest on, so they can be judged again; an investigation also when what it gathered arrives. |
| `iteration(k)` | What iteration `k` shows: `{ cards, links }`. Each card is `{ id, as }`, `as` being `raised`, `updated` (back with new material) or `carried` (an earlier one this iteration's cards rest on, as it last stood, with `from`, the iteration it stood in). Links, `{ from, to, means }`, are those among the cards shown, each to the version of what it rests on that stood by then; what brought a record about links to it only in the iteration where it did. Which order cards stand in is the sandbox's to choose. |
| `status(id, { asOf? })` | Any record's status as of an iteration, by its kind's rule (below). A kind without a rule keeps the `status` its record says. |
| `model(k?)` | The model as it stood by iteration `k` (the latest by default): `{ iteration, parts, classes, decisions, busiest }`. `classes` are by name, as tests use them; `decisions`, the compression signal, counts the choices in its code; `busiest` is the method with the most, `{ name, decisions }`. |
| `runs()` | Every run's id, versions first, then candidates. |
| `run(id)` | What a run found: `{ id, iteration, parts, tries?, changes, tests, met, notMet, decisions, busiest, change, arrived, metOnArrival }`. `tests` are those written by its iteration. `change`, against the version before or, for a trial, the model it would join: `{ met, broken, added, decisions, inPlace, kind, earnsItsPlace }`, `null` for the first version. `kind` says what sort of change it was, in words; it earns its place by meeting more and breaking nothing. `arrived` and `metOnArrival`: a version's new tests, and those the version before already met. |
| `results(testId, { asOf? })` | What a scenario or rule says against the model: a scenario's step results (`{ ok: true }` or `{ ok: false, actual }`, `null` where not checked), or a rule's failing cases. A test the model can't run fails, saying why. |
| `exercisedBy(partId, { asOf? })` | The tests that exercised a part when they ran, watched, and what each used: `[{ test, made, calls, reads }]`. An entity counts when made or called, a primitive only when its value is read. |
| `decisionsIn(cls)` | Where a class's decisions are: it and each class it extends, oldest first, `[{ cls, decisions, methods: [{ name, decisions }] }]`. |
| `partOfClass(cls, k)` | The part a class is in the model of iteration `k`. |
| `primitivesOf(entityId)` | The primitives an entity's class is made of, in any version. |
| `definitionOf(partId)` | The definition its name rests on: one it's founded on, defining that word; `null` if none. |
| `reviewReasons(decisionId, { asOf? })` | Why a decision needs another look: `[{ ref, now, why }]`, where `why` is `rests on` (a claim or assumption it rests on that has turned since it was taken) or `predicted` (a prediction of its not borne out). Empty when it stands. Put them in words as the sandbox likes. |

**What a link means** (`means`), from the kinds it joins and what their records say:

| Link | Means |
|---|---|
| a source to a claim | `supports` or `disputes`, by its passage's stance; from a source that speaks to what should be, `says it should` or `says it shouldn’t`, since it isn't counted |
| a source to a question | `asks` (raising it) or `answers` |
| a source to a goal, constraint, agreement, experiment, observation, assumption, definition, opinion or feedback | `sets`, `imposes`, `records`, `records`, `captures`, `states`, `defines`, `voices`, `voices` |
| feedback to what it's about | `bears out` (it works) or `disputes` (it's wrong) |
| a source to anything else | `records` if its catalogue `role` is `decision`, else `informs` |
| an observation to an assumption | `bears out` or `refutes`; to a prediction, `supports` or `doubts`; to an experiment, `result` |
| into a metric; an investigation to a source | `reading of`; `gathered` |
| a primitive to an entity | `part of` |
| into a run; a run to a test | `run in`, or `tried in` for a trial; `meets` or `doesn’t meet` |
| into an entity, primitive, scenario or rule | `founds` |
| into an investigation, experiment or inference | `prompts`, `calls for`, `premise` |
| an outcome to a decision; to what it's against | `prompts`; `meets`, `partly meets` or `fails`, by its result |
| an inference to an outcome; into an outcome | `explains`; `shows` |
| into a decision | `aims` from a goal, `constrains` from a constraint, else `grounds` |
| into a question, action, constraint or agreement, prediction, risk | `informs`, `calls for`, `brings about`, `predicts`, `raises` |
| into awaited material | `awaits` |

Anything else `rests on`. Use the words as they are, or say them the sandbox's way.

**Standing:** `corroborated` (two or more independent yeses), `single source`, `contested` (yeses and noes), `refuted` (only noes), `unbacked`. Only sources that speak to how things are count, and a copy counts as the source it copies.

**Score:** the grade of each counted yes, less each counted no.

**Basis**, from the yeses that speak to how things are: `observed` when data or an image backs it, `reported` when someone says so first-hand, `inferred` when only a derived source does; with nothing behind it, `conjecture`, or `assumption` once something rests on it.

**Passages**, in order, each `{ source, stance, quote, strength, counted }`, with repeats placed after the source they repeat. One that isn't counted says why: `repeats` (the source it copies, saying the same) or `outOfScope` (what its source speaks to: `what should be`). One from a source not graded yet has `ungraded: true`. A card can show them as they are.

**Statuses,** each worked out as of an iteration:

| Kind | Status |
|---|---|
| claim | its standing |
| question | `answered` once a source answering it has arrived and its answer is written; `unresolved` until then |
| assumption | `untested` until an observation tests it; `refuted` by any no, whatever says yes; otherwise `confirmed` |
| inference | `shaken` once any premise is in doubt (a claim refuted or contested, an assumption refuted, an inference shaken); otherwise `sound` |
| prediction | measured by the latest outcome against it: `borne out`, `partly`, `not borne out`; before one, `in doubt` or `supported` by results, else `pending` |
| investigation | `done` once a source it gathered has arrived; `under way` until then |
| experiment | `done` once a result has arrived; `planned` until then |
| action | `done` once what shows it has arrived; until then its written `status` |
| decision | `review` when it has review reasons; otherwise its written `status`. Grounds already in doubt when it was taken were part of its reasoning, not a reason. |
| outcome | its `result` |
| feedback | `declined` when written so; `answered` once a record founded on it has been raised; `open` until then |
| entity, primitive | `rejected` once turned down; `integrated` once a version of the model holds it; `trying` once a candidate tries it; `proposed` until then |
| scenario, rule | `met` when it passes against the model as it stood; `not met` otherwise |

**Decisions in code** are the points where it chooses: `if`, `case`, `&&`, `||`, `??` and the ternary `?`, counted with strings and comments taken out, so writing densely changes nothing.

## Notes

- **Dependencies:** none.
- **In a page:** a classic script, so it works opened from disk and survives single-file export. It adds one name to the page, `createDiscovery`.
- **Errors:** a claim, a source, a record or a run it doesn't have throws, naming it; so does asking for a part's results.
- **Running the model:** the engine calls the sandbox's scenarios and rules with its classes, and watches what they touch through proxies. Results are kept, since the model and the tests are fixed.
