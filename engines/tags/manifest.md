# tags

The engine of tagging: finding your way around a sandbox's tag map, with the rules written once. Give it the items that carry tags and the tags' declarations, and it says what carries a selection, what's like a set of items, and where to go from here, each result with a score. Read the [tagging practice](../../practices/tagging.md) first.

It draws nothing, reads no files and knows no component. Any sandbox can use it, discovery or not.

Use this engine through the interface below. You don't need to read its source.

## Usage

```html
<script src="lib/sandkit/engines/tags/tags.js"></script>
<script src="records/tags.js"></script>

<script>
  const tags = createTags({ lists: { SOURCES, CLAIMS, DECISIONS }, tags: TAGS });
  tags.find({ tags: ['platform-changes', 'passengers'] });
  // → { results: [{ id: 'CLM-4', kind: 'claim', label: 'Passengers miss…', score: 0.71, carries: [...], lacks: [], item }, …], total: 9, exact: 2, selection, followed: [], undeclared: [] }
</script>
```

In Node: `const { createTags } = require('./lib/sandkit/engines/tags/tags.js');`

## What it takes

`createTags({ lists, items, tags })`. Nothing given is ever changed.

- **`lists`:** the lists of records by name, such as `{ CLAIMS, DECISIONS }`. Each item's `kind` comes from its list's name, in the singular: `CLAIMS` holds `claim`s, `ENTITIES` `entity`s. An item with a `kind` of its own keeps it.
- **`items`:** records not in a named list, taken as they are. Each record, either way, has `id` and `tags`, and optionally `kind`, `supersedes`, `status` and `working`.
- **`tags`:** the declarations, `[{ tag, means, color?, replacedBy? }]`.

Its rules: an item superseded by another, or with `status: 'superseded'`, is left out. For an id given twice, the last one counts. `working` tags are never read.

## What it works out

A **selection** is `{ tags, match: 'all' | 'any', without }`, as `sb-tag-focus` and presets carry it. A preset can be passed as it is.

Every **score** runs from 0 to 1: how much of the weight of their tags two things share. 1 means exactly the same tags. Rarer tags weigh more, so a tag on most items counts for little. Below 10 items, every tag weighs the same.

| Member | Gives |
|---|---|
| `find(selection, { limit?, exclude? })` | `{ results, total, exact, selection, followed, undeclared }`, `selection` being what was searched once retired tags were followed, and `exact` how many carry exactly the chosen tags and no others: they all score 1, so they come in code order. Each result is `{ id, kind, label, score, carries, lacks, item }`, highest score first. With `all`, everything carrying every tag, those with the fewest other tags first. With `any`, everything carrying at least one, those carrying the rarer ones first. `without` leaves things out, and on its own leaves everything else that's tagged. |
| `like(ids, { limit?, exclude? })` | `{ results, total, unknown }`. Each result is `{ id, kind, label, score, shares, closest, item }`: scored against the one given item it's `closest` to, with the tags they `share`. What was given is left out, and so is anything sharing nothing. |
| `ways(selection)` | `{ narrow, widen }`, each step `{ add }`, `{ drop }` or `{ match }`, with its `count` and the `selection` it leads to. The gentlest come first, five at most. Dropping a tag or switching between all and any is offered only with two tags or more. |
| `list()` | Every tag: `[{ tag, means, …, declared, on }]`, those declared in their order, then any in use but never declared (`declared: false`, `means: null`). `on` lists the ids carrying it. |
| `items()` | The items it works from, after its rules. |

## Notes

- **A label** is what the item says, in one line: its first `title`, `text`, `quote`, `term`, `name`, `summary` or `of`, or `''`. Pages and tools show it, so they all say the same.
- **Retired tags** in a selection are swapped for their `replacedBy`, and `followed` says so: `[{ from, to }]`. A tag never declared still works, and `undeclared` names it.
- **Scores point where to look, never what's true.** No status or decision rests on one.
- **Ties** go by code, numbers counted as numbers (`CLM-2` before `CLM-10`), so the order never depends on how items were given, and the same items always give the same results.
- **Size:** instant for a few hundred items, and fine for a few thousand.
