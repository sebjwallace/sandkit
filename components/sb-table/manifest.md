# sb-table

Rows and columns to sort, search and filter. Use it wherever a sandbox has a set of comparable things: stores and their stock, teams in a league, planets, patients on a ward, accounts, cities, species.

The table knows nothing about the domain. The sandbox gives it rows; the table lets people order and narrow them, and marks the cells that changed since the last update, so a step of the model shows what it changed rather than only how things now stand.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-table/sb-table.js"></script>

<sb-table search></sb-table>

<script>
  const table = document.querySelector('sb-table');
  table.columns = [{ key: 'name', label: 'Store' }, { key: 'stock', label: 'Stock' }];
  table.rows = model.stores;            // [{ id: 'S1', name: 'North', stock: 37, tone: 'warn' }, …]
  table.sort = { key: 'stock', direction: 'ascending' };

  // After each step of the model, set the rows again: the cells that changed are marked.
  table.rows = model.stores;
</script>
```

## Rows and columns

Each row is an object of the sandbox's fields, plus two the table reads itself:

| Row field | Meaning |
|---|---|
| `id` | Identifies the row across updates, for marking changes and for `highlight`. Rows without one are never marked as changed. |
| `tone` | `good`, `warn` or `bad`. Colours the row with the theme's status tokens. |

`columns` chooses which fields to show, in order. Without it, every field of the first row is shown, except `id` and `tone`.

| Column field | Meaning |
|---|---|
| `key` | The row field to show. |
| `label` | The column heading. Defaults to `key`. |
| `format` | A function `(value, row) => text`, replacing the plain value. Sorting still uses the plain value; searching uses the text. |
| `align` | `left` or `right`. Defaults to `right` for columns holding only numbers. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `search` | off | Shows a search box above the table. |
| `empty-text` | `Nothing yet.` | Shown when there are no rows. |

## Properties

| Property | Meaning |
|---|---|
| `rows` | The rows, in their own order. Setting them marks every cell whose value differs from the row with the same `id` last time. The marks last until the next update. The table keeps its own copy, so a model may edit its rows in place. |
| `columns` | The fields to show. |
| `sort` | `{ key, direction }`, with `direction` `ascending` (the default) or `descending`, or `null` for the rows' own order. Clicking a heading cycles ascending, descending, off. Numbers sort by size, text naturally ("Item 2" before "Item 10"), and empty values go last. |
| `filter` | A function `(row) => boolean` choosing which rows to show, for filters the model or the sandbox's own controls decide. |
| `query` | The search text. Shows rows whose shown text contains it, ignoring case. Works with or without the search box. |
| `highlight` | `{ rows: [id, …], columns: [key, …], cells: [[id, key], …] }`: what to point at. |

When a filter or search hides rows, the table says how many it shows ("3 of 12 rows"), so hidden rows never go unnoticed.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ row }` | A row is clicked. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`.

Classes: `sb-table__bar`, `sb-table__search`, `sb-table__count`, `sb-table__scroll`, `sb-table__table`, `sb-table__sort` (the heading buttons; sorted headings carry `aria-sort`), `sb-table__row` (`--highlighted`), `sb-table__cell` (`--number`, `--changed`, `--highlighted`), `sb-table__empty`. Rows with an `id` carry `data-ref` with it, so a sandbox can find them and go to them (see the [locating practice](../../practices/locating.md)); rows hidden by search or `filter` aren't drawn, so aren't found. Rows carry `data-tone`; changed numbers carry `data-change="up"` or `"down"`, and every changed cell's `title` says what it was.

Give the element a height (for example `max-height: 320px`) so a long table scrolls under its headings.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-controls`](../sb-controls/manifest.md) or [`sb-scrubber`](../sb-scrubber/manifest.md).** On each step, set `rows` again, and the table marks what that step changed.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, so pointing at a thing in the prose lights up its row, column or cell.
- **[`sb-chart`](../sb-chart/manifest.md),** for the same values over time: the table shows where things stand and what just changed, the chart how they got there. Listen for `sb-select` to pick which row the chart follows.
- **[`sb-parameters`](../sb-parameters/manifest.md)** to change values, since the table doesn't edit them.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** headings are buttons, reachable from the keyboard, and announce their sort with `aria-sort`. The row count is announced as it changes.
- **Size:** made for the tens to hundreds of rows a sandbox shows. It has no paging; it scrolls.
- **Renaming:** if another component on the page is already called `sb-table`, the console says so. Replace every `sb-table` in `sb-table.js` (tag, classes and style id all use it) to give this copy a new name.
