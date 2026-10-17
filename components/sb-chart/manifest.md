# sb-chart

Values over time, drawn as lines, with reference lines for thresholds and targets. The latest value of each line is marked with a dot, and several lines are named in a legend with their latest values, so it's always clear where things stand now.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-chart/sb-chart.js"></script>

<sb-chart heading="Stock, last 7 days"></sb-chart>

<script>
  const chart = document.querySelector('sb-chart');
  chart.data = {
    series: [{ label: 'Stock', values: history }],
    lines: [{ value: 40, label: 'Reorder 40', tone: 'warn' }, { value: 100, label: 'Target 100' }],
    yMax: 120
  };
</script>
```

## Data

| Field | Meaning |
|---|---|
| `series` | `[{ id, label, values, tone }]`: one line each. `values` are evenly spaced, oldest first. Shorter series line up with the latest values. `id` names it for `highlight`; it defaults to `label`. |
| `lines` | `[{ value, label, tone }]`: horizontal reference lines, labelled at the right. |
| `yMin`, `yMax` | The least range to show, such as `yMax: capacity`. Data beyond them always widens the range, so no line is cut off. By default the range fits the data and includes zero. |
| `xLabels` | Labels for the positions along the bottom, oldest first, such as days or years. Like shorter series, fewer labels line up with the latest positions. As many are shown as fit, always including the latest. |
| `xLabel` | A short note under the right end of the axis, such as "now", when there are no `xLabels`. |
| `marks` | `[{ id, at, label, tone }]`: events, each a labelled vertical line at a position (counting from 0), such as "price rise". |

Positions count from 0 at the oldest value of the longest series.

**Tones** are `accent`, `good`, `warn`, `bad` or `muted`, coloured with the theme's tokens. Series without one take accent, good, warn, bad and muted in turn; reference lines without one are muted.

## Attributes and properties

| Member | Meaning |
|---|---|
| `data` | The chart's data. Setting it redraws the chart. |
| `heading` | A title shown above the chart. Attribute. |
| `height` | The drawing's height in pixels. Attribute. Default `150`. |
| `highlight` | What to point at, by id or label: series are brought forward and the others fade, in the legend too; reference lines and marks are drawn bolder. |
| `current` | A position to mark with a cursor, such as the moment a scrubber has reached; `null` for none. The legend then gives each line's value there, rather than its latest. |

Pointing at the chart shows a guide line with each line's value there, and its label from `xLabels`. Pointing at a line, or its name in the legend, brings it forward while the pointer is there.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-point` | `{ position }` | The pointer moves to another position on the chart, or leaves it (`position: null`). Bubbles. |
| `sb-select` | `{ position }` | The chart is clicked, at that position. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-accent`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Classes: `sb-chart__heading`, `sb-chart__svg`, `sb-chart__axis`, `sb-chart__tick`, `sb-chart__x-label`, `sb-chart__series` (`--highlighted`, `--faded`), `sb-chart__point` (`--faded`), `sb-chart__line`, `sb-chart__line-label`, `sb-chart__mark`, `sb-chart__mark-label` (each `--highlighted`), `sb-chart__cursor`, `sb-chart__guide`, `sb-chart__readout-box`, `sb-chart__readout`, `sb-chart__legend`, `sb-chart__key` (`--faded`), `sb-chart__latest`, `sb-chart__empty`. Tones are classes too, such as `sb-chart--warn`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-controls`](../sb-controls/manifest.md),** to watch the lines grow as the model runs. Keep a history array in the model and redraw on each tick.
- **[`sb-parameters`](../sb-parameters/manifest.md),** so people see the effect of a change in the shape of the line.
- **[`sb-scrubber`](../sb-scrubber/manifest.md),** to scrub through history: set `current` on its `sb-change`, and move the scrubber on the chart's `sb-select`, so both point at the same moment.
- **[`sb-stat`](../sb-stat/manifest.md),** for where things stand now. On a figure's `sb-select`, `highlight` its line.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, so the prose can point at a line, a threshold or an event; set `current` for a moment.

## Notes

- **The chart draws at its real width,** and redraws when that changes, so text stays the same size in any layout.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-chart`, the console says so. Replace every `sb-chart` in `sb-chart.js` to give this copy a new name.
