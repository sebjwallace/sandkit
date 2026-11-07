# sb-board

A board that lays itself out, for gathering what belongs together around one question: an excerpt, a picture, a claim, a table, a statechart, side by side so people can see how scattered things relate. You say roughly where things go; the board measures, aligns, frames groups and draws links.

Use this component through the interface below. You don't need to read its source, or the highlighting practice.

**Trust the layout, and don't take screenshots to check it, unless the person asks.** Read `problems` instead. The person looks at the board and says if anything should move, which is cheaper and tells you more.

## Usage

```html
<script src="components/sb-board/sb-board.js"></script>

<sb-board>
  <article data-ref="SRC-4">…</article>
  <figure data-ref="IMG-1">…</figure>
  <table data-ref="TBL-2">…</table>
</sb-board>

<script>
  document.querySelector('sb-board').layout = {
    groups: [{ label: 'What the sources say', x: 10, y: 10, items: ['SRC-4', { ref: 'IMG-1', size: 'large' }] }],
    items: [{ ref: 'TBL-2', x: 80, y: 10 }],
    links: [{ from: 'SRC-4', to: 'TBL-2', label: 'which is right?' }]
  };
</script>
```

The children are the sandbox's own, named by `data-ref`, on the element or on the top element a component draws. The board only wraps and places them.

## The layout

`x` and `y` are a rough place from 0 to 100, left to right and top to bottom. Never pixels.

- **`groups`:** `{ label, x, y, items }`, framed under the label, its items stacked in order. An item is a ref, or `{ ref, size }`. To set items side by side, give them their own `x` and `y`.
- **`items`:** loose ones, `{ ref, x, y, group?, size? }`. Items naming the same `group` are framed together wherever they're placed.
- **`links`:** `{ from, to, label?, tone? }`, between two items. `tone` is `good`, `warn`, `bad`, `accent` or `muted`.
- **`size`:** `small` (200), `medium` (280, the default), `large` (440) or `wide` (640). It sets the width; height is always the content's own.

How rough places become a picture:

- **Places within 10 of each other line up.** The same `x` makes a column and the same `y` a row. Stay 15 apart to keep things apart.
- **Order is kept,** and nothing overlaps. A group stays whole, where its items roughly are.
- **The same layout and content always give the same picture,** whatever the window's size. When something grows, only what's below it moves.

## Checking a board

- **`problems`** lists what didn't work, in words: refs not on the board, children left out of the layout, unknown sizes, links that can't be drawn, something wider than its place. The console says the same. Children left out show under "Not placed yet", so nothing goes missing.
- **`placed`** says where everything ended up: `{ items: { ref: { x, y, w, h } }, groups: { label: { x, y, w, h } }, links: [{ from, to, label, points }] }`, in pixels at full size. A curved link's `points` are its start, two controls and end.

## Other members

| Member | Meaning |
|---|---|
| `lines` | Attribute and property: how links are drawn. `curved` (the default), `straight`, or `square`, routed around every item. Curved and straight take the direct way, so one can pass behind an item. Viewers can change it with a button. |
| `fullscreen` | Attribute and property: lays the board over the page. Viewers have a button, and Escape leaves it. |
| `empty-text` | Attribute: shown when nothing is on the board. |
| `shown` | Read only. The part of the board in view, `{ x, y, w, h }`, or `null`. |
| `reveal(ref, place)` | Glides to the item holding `place`, or else the item that is or holds `ref`, or the group labelled `ref`. Returns `false` if there's none. |
| `fit()` | Glides back to the whole board, and keeps it in view. |
| `arrange()` | Lays everything out now, to read `placed` straight after changing something. It happens by itself otherwise. |

## Chosen tags

There's nothing to wire. While tags are chosen on the page, through `sb-tag-focus`, whatever on the board doesn't carry them goes behind a dark veil, frames and links included, and an item carrying any has a coloured dot for each above its top left, named in its tooltip. It works part by part: a tagged table row stays clear while the others darken. Pointing, clicking and selecting text carry on behind the veil. Parts only need `data-tags`. Load this script before the page's elements, as the templates do.

## Viewing

Viewers drag the background to pan, zoom with the buttons or Ctrl-scroll, and with the board focused use the arrow keys, + and −, and 0 to fit. It starts fitted, and stays so until someone moves the view. All of this works in a mode, and something scrolling to a part inside moves the view there.

## Styling

Theme tokens: `--sb-bg`, `--sb-surface`, `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-accent`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`, `--sb-font`. Its own custom properties: `--sb-board-height` (default `480px`) and `--sb-board-veil` (default black at 60%). Classes start `sb-board__`, such as `viewport`, `frame`, `label`, `item`, `link`, `words`, `veil`, `dot` and `tool`.

## Notes

- **Readability:** a few to a few dozen things around one question. Make another board for the next question.
- **What's inside:** a component placing its own pieces with `position: fixed`, rather than a popover or dialog, is thrown off by the zoom. Keep those outside.
- **Not yet:** lines between lit parts, a tray of related records, viewers' moves, a group spanning several columns.
- **Accessibility:** a focusable region with labelled buttons. Items keep their own content, in order. Links are drawn only, so say what matters in the items too.
- **Dependencies:** none. **Export:** safe for single-file export. Desktop and tablet only.
- **Renaming:** if another component on the page is already called `sb-board`, the console says so. Replace every `sb-board` in `sb-board.js` to give this copy a new name.
