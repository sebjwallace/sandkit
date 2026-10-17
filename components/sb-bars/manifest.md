# sb-bars

Bars comparing a set of things on one measure: stock per shop, money left per budget category, rain per town. All the bars share one scale, so the longest and shortest stand out at once. Use it wherever a sandbox asks "how do these compare right now?"

Bars run across, with their labels beside them, or up as columns. Each time the sandbox sets the bars again, every bar shows how far it moved since the last time, with a faint mark where it was, coloured as good or bad news. Reference lines across every bar, such as a limit or a target, give the values meaning.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-bars/sb-bars.js"></script>

<sb-bars sort="descending" better="higher"></sb-bars>

<script>
  const bars = document.querySelector('sb-bars');
  bars.lines = [{ id: 'reorder', value: 40, label: 'Reorder level', tone: 'warn' }];

  // Whenever the model changes:
  bars.bars = model.shops.map((s) => ({ id: s.id, label: s.name, value: s.stock, tone: s.stock === 0 ? 'bad' : undefined }));
</script>
```

## Bars and lines

| Bar field | Required | Meaning |
|---|---|---|
| `id` | yes, for changes | Matches a bar with itself last time, to show how it moved. |
| `label` | no | Shown beside the bar. Defaults to `id`. |
| `value` | yes | A number. Negative values grow left from zero. |
| `tone` | no | `accent` (the default), `good`, `warn`, `bad` or `muted`, coloured with the theme's tokens. |

| Line field | Required | Meaning |
|---|---|---|
| `value` | yes | Where the line falls. |
| `label` | no | Shown above the bars, at the line. |
| `id` | no | Names it for `highlight`. Defaults to `label`. |
| `tone` | no | As for bars. Lines without one are muted. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `orientation` | across | `vertical` draws columns rising from a shared baseline, values above them and labels below. When the labels don't fit under the columns, each column gets a number and a legend below names them. |
| `sort` | none | `descending` or `ascending` orders the bars by value; without it, they keep the order given. |
| `better` | none | `higher` or `lower`: which way is good news. Colours the changes green or red; without it, changes are neutral. |
| `min`, `max` | none | The least range to show, such as `max="100"` for a capacity. The scale always includes zero and every bar and line, so nothing is cut off. |
| `empty-text` | `Nothing yet.` | Shown when there are no bars. |

## Properties

| Property | Meaning |
|---|---|
| `bars` | The bars. Setting them shows each bar's change since the last time they were set, matched by `id`: ▲ or ▼ and by how much beside its value, and a mark on the bar where it was. Unchanged bars show nothing. Numbers in a legend follow the order given, so sorting never renumbers them. |
| `lines` | Reference lines across every bar. |
| `format` | A function `(value) => text` for values and changes, such as `(v) => '£' + v`. Defaults to plain numbers with thousands separators. |
| `highlight` | Ids of bars and lines to point at (or labels, for those without an id). A bar lights wherever it appears: its bar, its label or number, and its legend entry. |

Pointing at a bar, its label or its legend entry lights it the same way while the pointer is there.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ bar }` | A bar, its label or its legend entry is clicked. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Its own custom property: `--sb-bars-height`, the height of the columns' drawing (`180px`).

Classes: `sb-bars__item` (everything standing for a bar: its row or column, its label or number, its legend entry; `--highlighted`; carries `data-tone` and `data-name`), `sb-bars__fill`, `sb-bars__zero`, `sb-bars__was`, `sb-bars__line` (`--highlighted`), `sb-bars__line-label` (`--highlighted`), `sb-bars__value`, `sb-bars__change` (carries `data-verdict`), `sb-bars__empty`. Across: `sb-bars__list`, `sb-bars__head`, `sb-bars__row`, `sb-bars__label`, `sb-bars__track`. Up: `sb-bars__plot`, `sb-bars__area`, `sb-bars__column`, `sb-bars__reading`, `sb-bars__labels`, `sb-bars__key`, `sb-bars__legend`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-chart`](../sb-chart/manifest.md),** for one bar's history: on `sb-select`, show the chosen thing's values over time.
- **[`sb-controls`](../sb-controls/manifest.md) or [`sb-parameters`](../sb-parameters/manifest.md):** set the bars on every step or change, and each bar shows what that did.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, so the prose can point at a bar or a line.

## Notes

- **Columns check their labels fit** each time they're drawn and when their width changes, switching between labels and a legend as needed.
- **Not yet:** grouped or stacked bars wait until a sandbox needs them.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-bars`, the console says so. Replace every `sb-bars` in `sb-bars.js` to give this copy a new name.
