# sb-stat

Headline figures: the few numbers that say how things are going, large and plain. Use it wherever a sandbox has outcomes people watch: money left, people ill, stock on the shelves, months to a goal.

Each time the sandbox sets the figures again, each one shows how it changed since the last time and whether that's good news. A figure can have a maximum and a target, shown as a bar with the target marked.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-stat/sb-stat.js"></script>

<sb-stat></sb-stat>

<script>
  const stats = document.querySelector('sb-stat');

  // Call this whenever the model changes.
  function show(model) {
    stats.stats = [
      { id: 'stock', label: 'Stock', value: model.stock, max: 100, target: 40, better: 'higher' },
      { id: 'cost', label: 'Cost so far', value: model.cost, format: (v) => `£${v}`, better: 'lower' },
      { id: 'day', label: 'Day', value: model.day, unit: 'of 30' }
    ];
  }
</script>
```

## Stats

| Field | Required | Meaning |
|---|---|---|
| `id` | yes, for changes | Matches a figure with itself last time, to show its change. |
| `label` | no | What the figure is. Defaults to `id`. |
| `value` | yes | The figure. Numbers are shown with thousands separators unless `format` says otherwise. |
| `format` | no | A function `(value) => text`. Also formats the change and the target, so `£` and `%` come out right. |
| `unit` | no | Shown small after the value, such as `kg` or `of 30`. |
| `better` | no | `higher` or `lower`: which way is good news. Colours the change green or red. Without it, changes are neutral. |
| `max` | no | Shows a bar of the value out of `max`. |
| `target` | no | Marked on the bar when there's a `max`; otherwise given in words. |
| `tone` | no | `good`, `warn` or `bad`, for a threshold crossed. Colours the tile's edge, value and bar. |
| `note` | no | A line of small print under the figure. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `empty-text` | `Nothing yet.` | Shown when there are no stats. |

## Properties

| Property | Meaning |
|---|---|
| `stats` | The figures, in order. Setting them shows each numeric figure's change since the last time they were set, matched by `id`: ▲ or ▼ and by how much. Unchanged figures show nothing. |
| `highlight` | Ids of the figures to point at. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ stat }` | A tile is clicked. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface-2`, `--sb-accent`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`.

Its own custom property: `--sb-stat-width`, the narrowest a tile gets before the row wraps (`150px`).

Classes: `sb-stat__tile` (`--highlighted`; carries `data-tone`), `sb-stat__label`, `sb-stat__figure`, `sb-stat__value`, `sb-stat__unit`, `sb-stat__change` (carries `data-verdict`: `good`, `bad` or `neutral`), `sb-stat__meter`, `sb-stat__fill`, `sb-stat__target`, `sb-stat__note`, `sb-stat__empty`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-chart`](../sb-chart/manifest.md),** for how the figures got here: the figures say where things stand, the chart the history. On `sb-select`, show the chosen figure's line.
- **[`sb-controls`](../sb-controls/manifest.md) or [`sb-parameters`](../sb-parameters/manifest.md):** set the stats on every step or change, and each figure says what that step did.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight` when the prose mentions a figure.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-stat`, the console says so. Replace every `sb-stat` in `sb-stat.js` to give this copy a new name.
