# sb-grid

A grid of cells, each coloured by its state or its value: a forest burning, cells living and dying, heat spreading through a plate, seats filling in a theatre. Use it wherever a sandbox's model works across space, cell by cell.

A legend counts the cells in each state as the model runs, and pointing at a state shows where all its cells are. Viewers can paint cells, but the grid never changes itself: painting reports each cell to the sandbox, whose model decides what happens.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-grid/sb-grid.js"></script>

<sb-grid paintable></sb-grid>

<script>
  const grid = document.querySelector('sb-grid');
  grid.states = {
    0: { label: 'Bare ground', tone: 'surface' },
    1: { label: 'Tree', tone: 'good' },
    2: { label: 'Burning', tone: 'bad' }
  };
  grid.cells = model.forest;   // rows of values, top row first

  grid.addEventListener('sb-paint', (e) => {
    model.ignite(e.detail.row, e.detail.column);
    grid.cells = model.forest;
  });
</script>
```

## Cells, states and scale

`cells` is a list of rows, top row first, each a list of values. Colour them in one of two ways:

- **`states`:** `{ [value]: { label, tone, color } }`, for cells that are one of a few kinds. `tone` is a theme token's name (`accent`, `good`, `warn`, `bad`, `muted`, `text`, `surface`, `surface-2`); `color` is any CSS colour, for more kinds than there are tones. The legend lists the states in the order given, with how many cells are in each.
- **`scale`:** `{ min, max, tone }`, for numbers, shown as a heat map: from faint at `min` to the full tone at `max`. No legend.

Values with no state, or that aren't numbers on a scale, are left as background.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `paintable` | off | Pressing and dragging over cells fires `sb-paint` for each cell passed over. The grid doesn't change; the sandbox sets `cells` again. |
| `mark-changes` | off | Outlines the cells that changed since `cells` was last set. Best when a few cells change at a time; when most do, it's noise. |
| `empty-text` | `Nothing yet.` | Shown with no cells. |

## Properties

| Property | Meaning |
|---|---|
| `cells` | Rows of values. Setting them redraws the grid and updates the legend. The grid keeps its own copy, so a model may edit its cells in place. |
| `states` | What each value means, and its colour. |
| `scale` | Colours numbers as a heat map instead. |
| `highlight` | `{ cells: [[row, column]], rows: [row], columns: [column], states: [value] }`: what to point at. Cells, rows and columns are outlined; states fade every other cell and light their legend entries. Rows and columns count from 0. |

Pointing at a legend entry fades every other cell, while the pointer is there. Pointing at a cell outlines it and names it under the grid ("Row 4, column 12: Burning").

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ row, column, value }` | A cell is pressed. Bubbles. |
| `sb-paint` | `{ row, column, value }` | On a `paintable` grid, a cell is pressed, or passed over while pressing. Once per cell per drag. Bubbles. |
| `sb-point` | `{ row, column, value }`, or `null` | The pointer moves to another cell, or leaves the grid. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`. The grid is drawn on a canvas, which reads the tokens as it draws, and redraws when the theme changes (`sb-theme`).

Classes: `sb-grid__canvas`, `sb-grid__under`, `sb-grid__legend`, `sb-grid__key` (`--highlighted`; carries `data-state`), `sb-grid__swatch`, `sb-grid__count`, `sb-grid__readout`, `sb-grid__empty`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-controls`](../sb-controls/manifest.md),** to run the model: on each tick, step it and set `cells`.
- **[`sb-chart`](../sb-chart/manifest.md),** for the counts over time: the grid shows where, the chart how many and how it's going.
- **[`sb-parameters`](../sb-parameters/manifest.md),** for the rules' knobs, such as how dry the forest is.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, so the prose can point at a state, a row or a cell.

## Notes

- **Size:** cells are as large as fit the element's width, up to 24 pixels, and the grid redraws when its width changes. Hundreds of rows and columns are fine.
- **Accessibility:** the canvas describes itself with the grid's size and the count in each state.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-grid`, the console says so. Replace every `sb-grid` in `sb-grid.js` to give this copy a new name.
