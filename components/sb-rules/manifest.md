# sb-rules

A table of the rules a model follows, showing which rule is about to apply and which one just did. The difference between a table that lists rules and one that highlights the rule that just fired is the difference between displaying a model and revealing it.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-rules/sb-rules.js"></script>

<sb-rules group="state"></sb-rules>

<script>
  const rules = document.querySelector('sb-rules');
  rules.columns = [{ key: 'read', label: 'Read' }, { key: 'write', label: 'Write' }, { key: 'move', label: 'Move' }];
  rules.rules = model.rules;          // [{ id: 'INC-1', state: 'start', read: '0', write: '0', move: 'right' }, …]
  rules.active = model.nextRule;      // about to apply
  rules.fired = model.lastRule;       // just applied
</script>
```

## Rules and columns

Each rule is an object with an `id` (its code, shown in the first column) and any fields the sandbox likes. `columns` chooses which fields to show, in order:

| Column field | Meaning |
|---|---|
| `key` | The rule field to show. |
| `label` | The column heading. Defaults to `key`. |
| `format` | A function `(value, rule) => text`, replacing the plain value. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `group` | none | A rule field to group consecutive rules by, such as `state`. Each group gets a heading. |
| `code-label` | `Rule` | The heading of the code column. |
| `empty-text` | `No rules yet.` | Shown when there are no rules. |

## Properties

| Property | Meaning |
|---|---|
| `rules` | The rules, in order. |
| `columns` | The fields to show, after the code. |
| `active` | The id of the rule about to apply. Highlighted, marked "next", and kept in view in a long table. |
| `fired` | The id of the rule that applied last. Marked "just applied". |

## Slots

A child marked `slot="<rule id>"` replaces that rule's code cell, so a sandbox can show a richer code there. It is kept when the table redraws.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ rule }` | A rule's row is clicked. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`.

Classes: `sb-rules__table`, `sb-rules__group`, `sb-rules__rule` (with `--active` and `--fired`), `sb-rules__code`, `sb-rules__status`, `sb-rules__empty`. Each rule's row carries `data-ref` with the rule's id, so a sandbox can find it and go to it: see the [locating practice](../../practices/locating.md).

Give the element a height (for example `max-height: 320px`) so a long table scrolls.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-id`](../sb-id/manifest.md), so each code explains itself.** Put a pill in each rule's slot: `<sb-rules><sb-id slot="INC-1" code="INC-1"></sb-id>…</sb-rules>`.
- **[`sb-graph`](../sb-graph/manifest.md),** for state machines: highlight the same rule as a label line on the graph, so the table and the diagram point at the same thing.
- **[`sb-controls`](../sb-controls/manifest.md),** to step the model and watch the highlight move.

## Notes

- **Status is shown in words as well as colour** ("next", "just applied"), and the rule about to apply is marked `aria-current`.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-rules`, the console says so. Replace every `sb-rules` in `sb-rules.js` to give this copy a new name.
