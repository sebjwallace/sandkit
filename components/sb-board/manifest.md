# sb-board

Things moving through stages, as cards in columns: orders through a warehouse, bills through parliament, patients through a ward, cases through a court, tickets through a team. Use it wherever a sandbox's model moves many things through the same steps, and where they pile up matters. It is practical too: a sandbox's own board of questions to explore and ideas to try, moved along as the sandbox grows.

Each column counts its cards against its limit, so a bottleneck shows the moment it forms, and cards that just moved say which column they came from. Viewers can drag cards, but the board never moves them itself: dragging asks the sandbox, whose model decides.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-board/sb-board.js"></script>

<sb-board movable></sb-board>

<script>
  const board = document.querySelector('sb-board');
  board.columns = [
    { id: 'picking', label: 'Picking' },
    { id: 'packing', label: 'Packing', limit: 3 },
    { id: 'shipped', label: 'Shipped' }
  ];
  board.items = model.orders;   // [{ id: 'O-17', label: 'Order 17', column: 'packing' }, …]

  board.addEventListener('sb-move', (e) => {
    model.move(e.detail.item.id, e.detail.to);   // the model may refuse
    board.items = model.orders;
  });
</script>
```

## Columns and items

| Column field | Meaning |
|---|---|
| `id` | Identifies the column; items name it in `column`. |
| `label` | The column's heading. Defaults to `id`. |
| `limit` | Optional. How many cards the column should hold. Its count shows "4 / 3", and a column over its limit is flagged. The board never refuses a card for it. |

| Item field | Meaning |
|---|---|
| `id` | Identifies the card across updates, for marking moves and for `highlight`. Required. |
| `label` | The card's text. Defaults to `id`. |
| `column` | The `id` of the column it's in. Items in a column that isn't listed aren't shown. |
| `note` | Optional. A second, quieter line, such as how long it has waited. |
| `tone` | `good`, `warn` or `bad`. Colours the card's edge, so stuck or urgent cards stand out. |

Cards appear in their column in the order of `items`.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `movable` | off | Cards can be dragged to another column, or moved with the left and right arrow keys, firing `sb-move`. The board doesn't change; the sandbox sets `items` again. |
| `empty-text` | `Nothing yet.` | Shown with no columns. |

## Properties

| Property | Meaning |
|---|---|
| `columns` | The stages, left to right. |
| `items` | The cards. Setting them marks every card that changed column since the last time ("from Picking"), and every card that's new. The marks last until the next update. The board keeps its own record, so a model may edit its items in place. |
| `highlight` | `{ items: [id, …], columns: [id, …] }`: what to point at. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-move` | `{ item, from, to }` | On a `movable` board, a card is dropped on another column, or moved there with an arrow key. A request: nothing moves until the sandbox sets `items`. Bubbles. |
| `sb-select` | `{ item }` | A card is clicked, or Enter is pressed on it. Bubbles. |
| `sb-point` | `{ item }`, or `null` | The pointer moves onto another card, or leaves the board. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`.

Classes: `sb-board__columns`, `sb-board__column` (`--over`, `--highlighted`, `--drop`; carries `data-column`), `sb-board__head`, `sb-board__count`, `sb-board__cards`, `sb-board__card` (`--moved`, `--new`, `--highlighted`, `--dragging`; carries `data-id` and `data-tone`), `sb-board__note`, `sb-board__from`, `sb-board__empty`.

Columns share the width, each at least 150 pixels; with more than fit, the board scrolls sideways.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-controls`](../sb-controls/manifest.md),** to run the model: on each tick, step it and set `items`, and each step's moves are marked.
- **[`sb-chart`](../sb-chart/manifest.md),** for the column counts over time: the board shows where things are, the chart whether a queue is growing.
- **[`sb-log`](../sb-log/manifest.md),** for what happened to each card, including moves the model refused and why.
- **[`sb-rules`](../sb-rules/manifest.md),** for the rules that decide which moves are allowed.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, and announce a card's ref from `sb-point`, so a card and its mentions elsewhere light up together.

## Notes

- **Accessibility:** cards are focusable; Enter selects, and the arrow keys move on a movable board, with focus following the card. Each column is labelled with its count, and says when it's over its limit.
- **Size:** made for the tens of cards a sandbox shows at once. Columns grow with their cards; give the element a height and an `overflow` for a long board.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-board`, the console says so. Replace every `sb-board` in `sb-board.js` (tag, classes and style id all use it) to give this copy a new name.
