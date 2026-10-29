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

`createDiscovery({ sources, claims, questions, assumptions, inferences, observations, predictions, outcomes, investigations, experiments, actions, decisions, goals, metrics, excerpts, tags, definitions, opinions, feedback, agreements, constraints, risks, awaited, entities, primitives, hypotheses, problems, incidents, strategies, disputes, requirements, principles, patterns, antipatterns, optimizations, solutions, options, tradeoffs, recommendations, scenarios, rules, model })`. Give it the kinds the sandbox has; any left out is empty. Each list is plain records, each saying the `iteration` it was raised in; the engine never changes them.

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

**An excerpt**: a piece of one source, picked out as a record of its own, so that what rests on it cites it by id rather than copying it. `{ id, source, iteration, … }`, with its id the source's code and a number (`SRC-2.3`), and where it is in the source, as the [sources practice](../../practices/sources.md) anchors a citation: `quote` (the words), `page` and `quote` (a PDF), `region` (an image), `rows` (data). Every citation in the records below names an excerpt.

**Tags**: `[{ tag, means }]`, every tag the sandbox uses, declared once with what it means, such as `{ tag: 'platform-changes', means: 'How the board shows a train moved to another platform.' }`. Any source, excerpt or record can carry `tags: ['platform-changes', …]`, for finding it: searching, filtering, sorting and grouping. Tags work out nothing else.

**A claim**: `{ id, assertions: { 'SRC-2.3': '+' or '−', … } }`, each excerpt it cites with its stance, plus whatever else its record holds. A no can be written `'−'` or `'-'`.

**The other records**, and the fields their statuses read:

| Kind | Reads |
|---|---|
| question | `answer` (written up) and `answers: [excerptId, …]` |
| assumption | the observations testing it |
| observation | `tests: [id, '+' or '−']`, a verdict on an assumption or a prediction; `resultOf`, the experiment it's a result of |
| inference | `premises: [id, …]` |
| prediction | `from`, the decision that made it; the outcomes `against` it |
| outcome | `against`, `result`: `worked`, `partly` or `failed` |
| investigation | the sources whose `gatheredBy` names it |
| experiment | the observations whose `resultOf` names it |
| action | `status`, as written, and `done`, the excerpt or record showing it's done |
| decision | `status`, as written, `restsOn: [id, …]`, `chose` (the option it took) and `settles` (a dispute it settles) |
| hypothesis, requirement | the observations testing it |
| problem | the solutions whose `solves` names it |
| incident | `resolved`, the excerpt or record showing it's resolved |
| solution | `solves` (a problem, or several), `applied` (the excerpt or record showing it's applied), and `status`, as written until then |
| option | the decisions weighing it (`restsOn`) and taking it (`chose`) |
| recommendation | `recommends`, the option or solution it recommends; the decisions taking what it recommends, or resting on it and taking another |
| dispute | the agreements and decisions whose `settles` names it |
| feedback | `said`, the excerpt it was said in, `about` (what it's about: an id, or several), `verdict` (`works` or `wrong`), `declined` (the reason, when not acted on), and the records founded on it |

**What each kind rests on,** which makes the links. Each citation names an excerpt, and an excerpt rests on its `source`. A claim on the excerpts it asserts from, and it informs questions (`informs`); a question on the excerpt raising it (`raisedBy`) and those answering it (`answers`); a decision on `restsOn` and the excerpts it cites (`sources`); an action and a risk on what brought them about (`from`) and their sources; a prediction and an experiment on `from`, an experiment also on its excerpt (`setIn`); a goal, assumption, definition, agreement and constraint on the excerpt setting them (`setIn`, `said` for an opinion), an agreement or constraint also on `from`; an inference on its `premises`; an observation on the excerpt it was read from (`at`), and it bears on what it `tests`, its experiment (`resultOf`) and its `metric`; an outcome on `from` and its sources, and it bears on what it's measured `against`; an investigation on what prompted it (`prompt`), and a source on the investigation that gathered it (`gatheredBy`); entities, primitives, scenarios and rules on what they're `foundedOn`; awaited material on what it's `for`; feedback on the excerpt it was `said` in, and it bears on what it's `about`. A hypothesis on the excerpt stating it (`setIn`) and what prompted it (`from`); a problem on the excerpt raising it (`setIn`) and what shows it (`shownBy`); an incident on the excerpt reporting it (`at`); a strategy on its excerpt (`setIn`), what it `aims` at and the principles and patterns it `follows`; a requirement on its excerpt (`setIn`) and what brought it about (`from`); a principle, pattern, anti-pattern or optimization on its excerpt (`setIn`), an optimization also on its `metric`; a solution and an option on what they come `from` and their `sources`, and a solution bears on what it `solves`; a trade-off on what it's weighed `between` and its sources; a recommendation on what it `restsOn` and its sources, and it bears on what it `recommends`; a dispute on its excerpt (`setIn`), and it bears on what it's `about`; a decision also on the option it `chose`, and an agreement or decision on the dispute it `settles`. And any record rests on those it `supersedes`.

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

A scenario or rule needs no code until there's a model to run it on. Without `play` or `check`, it's still followed like any record: what it's founded on, the feedback about it, what replaces it.

**What the model adds to the links:** each version and candidate is a run, `RUN-1` onwards (versions first), resting on the parts it changed. An entity rests on its primitives. A part comes back in an iteration where its class or its stage changes; a test where what it says against the model does. The runs of an iteration that say something about a test link to it there: the model's own run, and a trial's where it newly meets it.

## What it works out

| Member | Gives |
|---|---|
| `weigh(claim, { asOf?, reliedOn? })` | A claim, by its id or as a record, weighed on the excerpts picked out by iteration `asOf` (every one by default), each by its source; an excerpt superseded by then counts as the one replacing it. `reliedOn`: whether anything rests on it, which tells an assumption from a conjecture when nothing backs it. Returns `{ standing, score, basis, passages }`. |
| `strength(sourceId)` | A source's grade's value, 1 to 5; 3 when it isn't graded yet. |
| `originOf(sourceId)` | The source it copies, all the way back, or itself. |
| `links()` | Every link, `{ from, to, means }`, from what something rests on to what rests on it, each once. `means` says what it means, in words (below). |
| `inputsOf(id)` | What a record rests on: `{ material, records }`, its material being the sources and excerpts. |
| `excerptsOf(id)` | Every excerpt a record rests on, all the way back through what it rests on: the passages behind a scenario, a rule or a decision. The walk stops at sources. |
| `tags()` | Every tag, `[{ tag, means, declared, on }]`: those declared, in their order, then any in use but never declared (`declared: false`, `means: null`). `on` lists the ids carrying it, sources first; empty for a tag declared but unused. |
| `appearances(id)` | The iterations it appears in: the one it was raised in, each later one bringing new material for it, the one where something replaced it, and, for decisions, goals, predictions, experiments, metrics, assumptions, hypotheses, inferences, requirements, optimizations and problems, each one bringing back what they rest on, so they can be judged again; an investigation also when what it gathered arrives. |
| `iteration(k)` | What iteration `k` shows: `{ cards, links }`. Each card is `{ id, as }`, `as` being `raised`, `updated` (back with new material) or `carried` (an earlier one this iteration's cards rest on, as it last stood, with `from`, the iteration it stood in). Links, `{ from, to, means }`, are those among the cards shown, each to the version of what it rests on that stood by then; what brought a record about links to it only in the iteration where it did. Which order cards stand in is the sandbox's to choose. |
| `standing(k)` | Everything standing by iteration `k`, for a sandbox following it all rather than what the iteration changed: `{ cards, links }`. Every source and record raised by then; those `iteration(k)` shows raised or updated are so, the rest `carried`, with `from`, the iteration where they last changed. Links, `{ from, to, means }`, are every one among them from `links()`. |
| `status(id, { asOf? })` | Any record's status as of an iteration, by its kind's rule (below). A kind without a rule keeps the `status` its record says. |
| `model(k?)` | The model as it stood by iteration `k` (the latest by default): `{ iteration, parts, classes, decisions, busiest }`. `classes` are by name, as tests use them; `decisions`, the compression signal, counts the choices in its code; `busiest` is the method with the most, `{ name, decisions }`. |
| `runs()` | Every run's id, versions first, then candidates. |
| `run(id)` | What a run found, against the tests written by its iteration that have code and haven't been replaced: `{ id, iteration, parts, tries?, changes, tests, met, notMet, decisions, busiest, change, arrived, metOnArrival }`. `tests` are those written by its iteration. `change`, against the version before or, for a trial, the model it would join: `{ met, broken, added, decisions, inPlace, kind, earnsItsPlace }`, `null` for the first version. `kind` says what sort of change it was, in words; it earns its place by meeting more and breaking nothing. `arrived` and `metOnArrival`: a version's new tests, and those the version before already met. |
| `results(testId, { asOf? })` | What a scenario or rule says against the model (`null` when it has no code): a scenario's step results (`{ ok: true }` or `{ ok: false, actual }`, `null` where not checked), or a rule's failing cases. A test the model can't run fails, saying why. |
| `exercisedBy(partId, { asOf? })` | The tests that exercised a part when they ran, watched, and what each used: `[{ test, made, calls, reads }]`. An entity counts when made or called, a primitive only when its value is read. |
| `decisionsIn(cls)` | Where a class's decisions are: it and each class it extends, oldest first, `[{ cls, decisions, methods: [{ name, decisions }] }]`. |
| `partOfClass(cls, k)` | The part a class is in the model of iteration `k`. |
| `primitivesOf(entityId)` | The primitives an entity's class is made of, in any version. |
| `definitionOf(partId)` | The definition its name rests on: one it's founded on, defining that word; `null` if none. |
| `reviewReasons(decisionId, { asOf? })` | Why a decision needs another look: `[{ ref, now, why }]`, where `why` is `rests on` (a claim, assumption or hypothesis it rests on that has turned since it was taken) or `predicted` (a prediction of its not borne out). Empty when it stands. Put them in words as the sandbox likes. |

**What a link means** (`means`), from the kinds it joins and what their records say:

| Link | Means |
|---|---|
| a source to its excerpt | `contains` |
| an excerpt to a claim | `supports` or `disputes`, by its stance; from a source that speaks to what should be, `says it should` or `says it shouldn’t`, since it isn't counted |
| an excerpt to a question | `asks` (raising it) or `answers` |
| an excerpt to a goal, constraint, agreement, experiment, observation, assumption, definition, opinion or feedback | `sets`, `imposes`, `records`, `records`, `captures`, `states`, `defines`, `voices`, `voices` |
| an excerpt to a hypothesis, problem, incident, strategy, dispute, requirement, principle, pattern, anti-pattern or optimization | `states`, `raises`, `reports`, `sets`, `voices`, `sets`, `states`, `describes`, `describes`, `sets` |
| an excerpt or a source to an entity, primitive, scenario or rule | `founds` |
| feedback to what it's about | `bears out` (it works) or `disputes` (it's wrong) |
| an excerpt to anything else | `records` if its source's catalogue `role` is `decision`, else `informs` |
| an observation to an assumption or hypothesis | `bears out` or `refutes`; to a requirement, `meets` or `fails`; to a prediction, `supports` or `doubts`; to an experiment, `result` |
| into a metric; an investigation to a source | `reading of`; `gathered` |
| a primitive to an entity | `part of` |
| into a run; a run to a test | `run in`, or `tried in` for a trial; `meets` or `doesn’t meet` |
| into an entity, primitive, scenario or rule | `founds` |
| into an investigation, experiment or inference | `prompts`, `calls for`, `premise` |
| an outcome to a decision; to what it's against | `prompts`; `meets`, `partly meets` or `fails`, by its result |
| an inference to an outcome; into an outcome | `explains`; `shows` |
| a metric to an optimization; a solution to a problem | `measures`; `solves` |
| a dispute to what it's about; to what settles it | `disputes`; `settled by` |
| an option to a decision | `chosen in` when the decision `chose` it, else `weighed in` |
| a recommendation to what it recommends | `recommends` |
| into a decision, strategy, option, solution or recommendation | `aims` from a goal or optimization, `constrains` from a constraint, `requires` from a requirement, `guides` from a principle, pattern or strategy, `warns against` from an anti-pattern, `weighs` from a trade-off, `advises` from a recommendation; into a decision, anything else `grounds` |
| into a hypothesis; into a trade-off | `prompts`; `weighed in` |
| into a question, action, constraint, agreement or requirement, prediction, risk, problem | `informs`, `calls for`, `brings about`, `predicts`, `raises`, `shows` |
| into awaited material | `awaits` |
| a record to the one replacing it | `replaced by` |

Anything else `rests on`. Use the words as they are, or say them the sandbox's way.

**Standing:** `corroborated` (two or more independent yeses), `single source`, `contested` (yeses and noes), `refuted` (only noes), `unbacked`. Only sources that speak to how things are count, and a copy counts as the source it copies.

**Score:** the grade of each counted yes, less each counted no.

**Basis**, from the yeses that speak to how things are: `observed` when data or an image backs it, `reported` when someone says so first-hand, `inferred` when only a derived source does; with nothing behind it, `conjecture`, or `assumption` once something rests on it.

**Passages**, in order, each `{ excerpt, source, stance, quote?, strength, counted }`, with repeats placed after the source they repeat. One standing for a superseded excerpt the claim cites says which (`replaces`); an excerpt reached twice that way appears once. One that isn't counted says why: `repeats` (the source it copies, saying the same) or `outOfScope` (what its source speaks to: `what should be`). One from a source not graded yet has `ungraded: true`. A card can show them as they are.

**Statuses,** each worked out as of an iteration. Any record, of any kind, is `superseded` once a record naming it in `supersedes` (an id, or several) has been raised; until then:

| Kind | Status |
|---|---|
| claim | its standing |
| question | `answered` once an excerpt answering it has been picked out and its answer is written; `unresolved` until then |
| assumption | `untested` until an observation tests it; `refuted` by any no, whatever says yes; otherwise `confirmed` |
| inference | `shaken` once any premise is in doubt (a claim refuted or contested, an assumption or hypothesis refuted, an inference shaken); otherwise `sound` |
| hypothesis | `untested` until an observation tests it; `refuted` by any no, whatever says yes; otherwise `supported` |
| requirement | `untested` until an observation tests it; `not met` by any no; otherwise `met` |
| prediction | measured by the latest outcome against it: `borne out`, `partly`, `not borne out`; before one, `in doubt` or `supported` by results, else `pending` |
| investigation | `done` once a source it gathered has arrived; `under way` until then |
| experiment | `done` once a result has arrived; `planned` until then |
| action | `done` once what shows it has arrived; until then its written `status` |
| decision | `review` when it has review reasons; otherwise its written `status`. Grounds already in doubt when it was taken were part of its reasoning, not a reason. |
| outcome | its `result` |
| problem | `solved` once a solution to it is applied; `open` until then |
| incident | `resolved` once what shows it has arrived; `open` until then |
| solution | `applied` once what shows it has arrived; until then its written `status`, or `proposed` |
| option | `chosen` once a decision takes it; `set aside` once a decision weighing it takes another; `open` until then |
| recommendation | `followed` once a decision takes what it recommends; `declined` once a decision resting on it takes another; `proposed` until then |
| dispute | `settled` once an agreement or decision settling it is raised; `open` until then |
| feedback | `declined` when written so; `answered` once a record founded on it has been raised; `open` until then |
| entity, primitive | `rejected` once turned down; `integrated` once a version of the model holds it; `trying` once a candidate tries it; `proposed` until then |
| scenario, rule | `met` when it passes against the model as it stood; `not met` otherwise. Without code, the `status` its record says, if any |

**Decisions in code** are the points where it chooses: `if`, `case`, `&&`, `||`, `??` and the ternary `?`, counted with strings and comments taken out, so writing densely changes nothing.

## Notes

- **Dependencies:** none.
- **In a page:** a classic script, so it works opened from disk and survives single-file export. It adds one name to the page, `createDiscovery`.
- **Errors:** a claim, a source, an excerpt, a record or a run it doesn't have throws, naming it; so does asking for a part's results.
- **Running the model:** the engine calls the sandbox's scenarios and rules with its classes, and watches what they touch through proxies. Results are kept, since the model and the tests are fixed.
