# discovery

The engine of domain discovery: the method's rules, written once. Give it the sandbox's records and it works out what follows from them, the same way every time, so a record holds only what someone wrote and never a conclusion. Read the [domain discovery practice](../../practices/domain-discovery.md) first: it says what records there are and where they're kept.

It draws nothing and knows no component; the practice says how a sandbox shows what it works out.

So far it weighs claims. Statuses, iterations, links and the model's runs are to come.

Use this engine through the interface below. You don't need to read its source.

## Usage

In a page, as a classic script, beside the records it reads:

```html
<script src="lib/sandkit/engines/discovery/discovery.js"></script>
<script src="records/claims.js"></script>

<script>
  const discovery = createDiscovery({ sources, claims });
  const weighed = discovery.weigh('CLM-3', { asOf: 2, reliedOn: true });
  // weighed.standing → 'contested', weighed.score → -12, weighed.basis → 'reported'
</script>
```

In Node, for tests and tools:

```js
const { createDiscovery } = require('./lib/sandkit/engines/discovery/discovery.js');
```

## What it takes

`createDiscovery({ sources, claims })`. Each list is plain records; the engine never changes them.

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

## What it works out

| Member | Gives |
|---|---|
| `weigh(claim, { asOf?, reliedOn? })` | A claim, by its id or as a record, weighed on the sources that had arrived by iteration `asOf` (every source by default). `reliedOn`: whether anything rests on it, which tells an assumption from a conjecture when nothing backs it. Returns `{ standing, score, basis, passages }`. |
| `strength(sourceId)` | A source's grade's value, 1 to 5; 3 when it isn't graded yet. |
| `originOf(sourceId)` | The source it copies, all the way back, or itself. |

**Standing:** `corroborated` (two or more independent yeses), `single source`, `contested` (yeses and noes), `refuted` (only noes), `unbacked`. Only sources that speak to how things are count, and a copy counts as the source it copies.

**Score:** the grade of each counted yes, less each counted no.

**Basis**, from the yeses that speak to how things are: `observed` when data or an image backs it, `reported` when someone says so first-hand, `inferred` when only a derived source does; with nothing behind it, `conjecture`, or `assumption` once something rests on it.

**Passages**, in order, each `{ source, stance, quote, strength, counted }`, with repeats placed after the source they repeat. One that isn't counted says why: `repeats` (the source it copies, saying the same) or `outOfScope` (what its source speaks to: `what should be`). One from a source not graded yet has `ungraded: true`. A card can show them as they are.

## Notes

- **Dependencies:** none.
- **In a page:** a classic script, so it works opened from disk and survives single-file export. It adds one name to the page, `createDiscovery`.
- **Errors:** a claim or a source it doesn't have throws, naming it.
