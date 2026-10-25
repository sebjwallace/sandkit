# discovery

The engine of domain discovery: the method's rules, written once. Give it the sandbox's records and it works out what follows from them, the same way every time, so a record holds only what someone wrote and never a conclusion. Read the [domain discovery practice](../../practices/domain-discovery.md) first: it says what records there are and where they're kept.

It draws nothing and knows no component; the practice says how a sandbox shows what it works out.

So far it weighs claims and works out every status that follows from the records. Iterations, links and the model's runs are to come.

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
</script>
```

In Node, for tests and tools:

```js
const { createDiscovery } = require('./lib/sandkit/engines/discovery/discovery.js');
```

## What it takes

`createDiscovery({ sources, claims, questions, assumptions, inferences, observations, predictions, outcomes, investigations, experiments, actions, decisions })`. Give it the kinds the sandbox has; any left out is empty. Each list is plain records, each saying the `iteration` it was raised in; the engine never changes them.

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

## What it works out

| Member | Gives |
|---|---|
| `weigh(claim, { asOf?, reliedOn? })` | A claim, by its id or as a record, weighed on the sources that had arrived by iteration `asOf` (every source by default). `reliedOn`: whether anything rests on it, which tells an assumption from a conjecture when nothing backs it. Returns `{ standing, score, basis, passages }`. |
| `strength(sourceId)` | A source's grade's value, 1 to 5; 3 when it isn't graded yet. |
| `originOf(sourceId)` | The source it copies, all the way back, or itself. |
| `status(id, { asOf? })` | Any record's status as of an iteration, by its kind's rule (below). A kind without a rule keeps the `status` its record says. |
| `reviewReasons(decisionId, { asOf? })` | Why a decision needs another look: `[{ ref, now, why }]`, where `why` is `rests on` (a claim or assumption it rests on that has turned since it was taken) or `predicted` (a prediction of its not borne out). Empty when it stands. Put them in words as the sandbox likes. |

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

## Notes

- **Dependencies:** none.
- **In a page:** a classic script, so it works opened from disk and survives single-file export. It adds one name to the page, `createDiscovery`.
- **Errors:** a claim, a source or a record it doesn't have throws, naming it.
