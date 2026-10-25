# sb-board

A board to pan and zoom, like a wall things are pinned to: notes, sources, images and diagrams placed where they belong together, grouped in labelled frames, with pen marks pointing out what matters. Use it wherever the arrangement itself says something: evidence gathered for a question, a brainstorm grouped by theme, a picture to tell a story around with a tour.

The board owns only space, frames and marks. Everything with content is the sandbox's own, placed on the board as an item, so marks never grow into notes of their own.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-board/sb-board.js"></script>

<sb-board id="evidence" movable>
  <article data-ref="GAUGE-2">…</article>
  <figure data-ref="IMG-1">…</figure>
  <article data-ref="SRC-4">…</article>
</sb-board>

<script>
  const board = document.getElementById('evidence');
  board.layout = {
    frames: [
      { ref: 'F-READINGS', label: 'Readings', x: 0, y: 0, w: 260, h: 330 },
      { ref: 'F-ACCOUNTS', label: 'Accounts', x: 680, y: 0, w: 280, h: 330 }
    ],
    items: {
      'GAUGE-2': { x: 20, y: 48, w: 220 },
      'IMG-1': { x: 300, y: 48, w: 340 },
      'SRC-4': { x: 700, y: 48, w: 240 }
    },
    marks: [{ ref: 'M-1', kind: 'arrow', from: 'GAUGE-2', to: 'SRC-4', label: 'which is right?' }]
  };
  board.addEventListener('sb-moves', () => showChanges(board.changes));
</script>
```

The agent writes the layout, in the page or in a data script such as `layout.js`. Viewers move things on a `movable` board; their moves are kept apart from the layout, and `changes` says what they moved, in words to hand back to the agent, who writes them into the layout.

## The layout

Everything is placed in board units, which are pixels at full size. `x` grows to the right and `y` downwards, and either may be negative.

- **`items`:** the sandbox's children by `data-ref`: `{ ref: { x, y, w } }`. Each child names itself with `data-ref`; `w` defaults to 240 and the height is the content's own. A child the layout leaves out, or one without a `data-ref`, goes in a row below everything else, so nothing goes missing.
- **`frames`:** labelled regions drawn behind the items, grouping them by role: `[{ ref, label, x, y, w, h }]`. Leave about 40 units at the top of a frame for its label. Without a `label`, the `ref` is shown.
- **`marks`:** pen marks drawn on top: `[{ ref, kind, on, from, to, label, tone }]`.

| Mark `kind` | Drawn | Anchored by |
|---|---|---|
| `box` | A rough box around it | `on` |
| `circle` | A loop around it | `on` |
| `underline` | A line under it | `on` |
| `label` | Only the words: beside a thing, or at a place | `on` |
| `arrow` | A gently bent arrow from one to the other | `from` and `to` |

An anchor is a ref (a frame, an item, or any part inside an item marked with `data-ref`), or a place: `{ x, y }`, or `{ x, y, w, h }` for an area. Prefer refs: a mark anchored to a ref follows it when it moves, and "an arrow from the gauge to the interview" says far more to the agent than a position. `label` is a few handwritten words; `tone` (`good`, `warn` or `bad`) changes the ink. `ref` is optional, for revealing and pointing at the mark. A mark of an unknown kind, or anchored to something not on the board, isn't drawn.

A mark only comments. A note, a quote or anything else with content belongs on the board as an item.

## Attributes

| Attribute | Meaning |
|---|---|
| `movable` | Viewers can drag items to move them. Pressing a link, button, field or anything focusable inside an item uses it rather than dragging. |
| `id` | Remembers each viewer's moves in their browser, as `sb-board:<id>`. Set it before setting `layout`, which is when remembered moves are read. |
| `empty-text` | Shown when there is nothing on the board. Default "Nothing on the board yet." |

## Properties

| Property | Meaning |
|---|---|
| `layout` | `{ frames, items, marks }`, as above. Reads back as a copy. |
| `changes` | Read only. What viewers have moved, in the order they first moved it: `[{ ref, from, to, words }]`. `from` is where the layout put the item (`null` if it didn't), `to` where it is now, and `words` say it: "Moved SRC-3 from Readings into Accounts, beside SRC-4." |
| `shown` | Read only. The part of the board in view now, as `{ x, y, w, h }`, or `null` before it's shown. |

Setting properties never fires the events below; they are for what viewers do.

## Methods

| Method | Meaning |
|---|---|
| `reveal(ref, place)` | Glides to the item, frame or mark holding `place`, an element on the page, or without one the frame or mark named `ref`, or the item that is or holds `data-ref="ref"`. Shows it whole, never larger than full size. Returns `true`, or `false` if the board holds no such thing. |
| `fit()` | Glides back to the whole board, and keeps it in view as things change. The same as the Fit button. |
| `revert()` | Puts every item back where the layout says, forgetting the viewer's moves. Quiet: no `sb-moves`. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-moves` | `{ changes }`, as the property | A viewer drops an item they dragged. Bubbles. |

## A viewer's moves and the agent's layout

The layout is the agent's, and stays so. A viewer's move is kept apart from it, recording where the layout put the item and where it went. Each time `layout` is set, every move is checked:

- **The layout now puts the item where it was moved:** the agent has taken the move in, so it's dropped.
- **The layout no longer puts it where the move started:** the agent has moved it since, so the agent's place wins and the move is dropped.
- **Otherwise** the move stays.

So the round trip is: viewers move things, the sandbox hands `changes` to the agent (for example in a handoff prompt), the agent writes them into the layout, and on the next load the moves drop away by themselves. Treat a move as something said: how someone groups things shows how they think.

## Viewing

- **Starting:** the whole board in view, never larger than full size. It stays fitted as content arrives or grows, until a viewer or the sandbox moves the view.
- **Panning:** drag the background or a frame, anywhere, past the board's edges too.
- **Zooming:** the + and − buttons, or Ctrl-scroll (⌘ on a Mac), which a trackpad pinch also sends. Plain scrolling is left to the page. Viewers can zoom out until the whole board fits, and in to twice full size.
- **Keyboard:** with the board focused, the arrow keys pan, + and − zoom, and 0 fits the whole board.

## Styling

Theme tokens: `--sb-bg`, `--sb-surface`, `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-accent`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`, `--sb-font`.

Its own custom properties, to set on the element: `--sb-board-height` (default `480px`) and `--sb-board-pen`, the ink of marks without a tone (default a red marker, mixed from `--sb-bad` and `--sb-text`).

Classes: `sb-board__viewport` (`--dragging`, `--glide`), `sb-board__space`, `sb-board__frames`, `sb-board__frame` (carries `data-ref`), `sb-board__label`, `sb-board__items`, `sb-board__item` (`--dragging`; wraps each of the sandbox's children, which keep their own `data-ref`), `sb-board__marks` (an SVG layer), `sb-board__mark` (`--box`, `--circle`, `--underline`, `--label`, `--arrow`; carries `data-ref` and `data-tone`), `sb-board__stroke`, `sb-board__pen` (a mark's words), `sb-board__tools`, `sb-board__tool`, `sb-board__empty`.

Frames and marks carry `data-ref` with their ref, so a sandbox can find them (see the [locating practice](../../practices/locating.md)). Items are the sandbox's own elements, with their own `data-ref`.

## Notes

- **Readability:** made for a few to a few dozen things, gathered around one question. Make another board for the next question rather than one wall for everything.
- **Not yet:** viewers drawing marks, moving frames, moving items with the keyboard, and showing less detail when zoomed out wait until a sandbox needs them.
- **Desktop and tablet:** dragging and pinching need room; phones are out of scope.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets. Handwriting uses fonts already on the viewer's computer.
- **Accessibility:** the board is a focusable region, panned and zoomed with the keys above. Items keep their own content, in order. Marks' words are text, read in order after the items.
- **Renaming:** if another component on the page is already called `sb-board`, the console says so. Replace every `sb-board` in `sb-board.js` (tag, classes, style id, storage key and the custom properties all use it) to give this copy a new name.
