# sb-discovery-board

A board of discovery: the sandbox's own items in columns, one for each part they play in an iteration, running across or down. Pointing at an item lights its chain, back along what led to it and on along what it led to, and draws only those links, labelled; everything else fades. Columns fold down to make room. Read the [domain discovery practice](../../practices/domain-discovery.md) first: it says what goes on a board, and in which columns.

The board knows nothing about what it holds. It places each child by its `data-ref`, in the column that lists it, and draws the links the sandbox gives it. Which items there are, which column each goes in and what each link means are the sandbox's to work out.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-discovery-board/sb-discovery-board.js"></script>

<sb-discovery-board>
  <div data-ref="SRC-1">…</div>
  <div data-ref="CLM-1">…</div>
</sb-discovery-board>

<script>
  const board = document.querySelector('sb-discovery-board');
  board.columns = [
    { title: 'Gathered', refs: ['SRC-1'] },
    { title: 'Interpreted', refs: ['CLM-1'] },
  ];
  board.links = [{ from: 'SRC-1', to: 'CLM-1', label: 'supports', tone: 'good' }];
</script>
```

## Items

The board's children, each with a `data-ref`. The board places each in the column that lists its ref, in that column's order, and leaves its content alone: it adds nothing to it. A child no column lists isn't shown. To change what's on the board, replace the children, then set `columns` again.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `direction` | `across` | `across`: the columns side by side, with room between them for links to turn and be labelled; the board scrolls sideways when they don't fit. `down`: each column a band, its title on the left. |
| `spacing` | `96` across, `30` down | The room between columns going across, or between bands going down, in pixels. Give a busy board more, so its links have room to turn and be read. Changing it while a chain is lit redraws its links. |

## Properties and methods

| Member | Meaning |
|---|---|
| `columns` | `[{ title, refs, folded? }]`, in order. A column none of whose refs is on the board isn't shown. `folded` starts it folded; once the viewer folds or unfolds a column, that's kept, by title, when the columns are set again. Setting it redraws. |
| `links` | `[{ from, to, label?, tone? }]`: what leads to what, by ref. Drawn only along a lit chain; a link to anything not on the board is left out. `tone` colours the line, its arrowhead, its dot and its label: `good`, `warn`, `bad`, `accent` (the default), `muted` or `text`, from the theme, so a chain reads at a glance (what supports in good, what disputes in bad). Links sharing a label take the first one's tone for it. |
| `direction`, `spacing` | Mirror the attributes. |
| `highlight` | Refs to light from outside: those items stand out, nothing fades and no links are drawn. Never redraws. |
| `reveal(ref)` | Unfolds the column holding `ref`, and returns whether the board holds it (see the [locating practice](../../practices/locating.md)). |

## Chains

Pointing at an item, or focus moving into it, lights everything that leads to it (following links backwards) and everything it leads to (forwards), and draws the links along those two ways only, so a side branch into the chain stays dark. The item pointed at is outlined, the rest of the chain lit, everything else faded. Leaving the board, or pointing at its background, clears it.

How links are drawn, so a lit chain stays readable:

- **No two links share a run.** All the links on a lit chain are planned together: each leaves from its own point on its item's side and arrives at its own, every run across a gap has its own track, and links side by side run parallel, a few pixels apart, ordered so they don't cross where they can avoid it.
- **Routes run like a transit map,** square, with rounded corners, from a dot where a link leaves to an arrowhead where it arrives, in the gaps between columns.
- **Past a column, a link takes a lane clear of its items,** never behind one, so it can't be read as joining something it passes. Links going back take a lane beyond the items, so links running opposite ways never share a run.
- **Each side of an item is laid out as a whole.** Going across, links move on into an item's left side, and come back, or stay in their column, into its right; going down, they come into the top, or the bottom going back up. On each side, the links arriving and leaving are ordered by where they come from or head, so nothing crosses at the item, and centred on it.
- **Links of one label arrive side by side under one label:** beside a column, above them on the left and below them on the right, so labels in one gap face away from each other; along a band, after them, with room for the label. Runs in a gap keep clear of the labels arriving at the next column. A label that would still crowd another moves along until it's clear.

## Events

None. The items are the sandbox's own, so opening, pointing and announcing are theirs; the board only lays them out and lights chains.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-bg`, `--sb-surface`, `--sb-accent`, `--sb-accent-soft`, `--sb-radius`, `--sb-font`. Its own: `--sb-discovery-board-column` (a column's width going across, `170px`), `--sb-discovery-board-folded` (a folded column's width, `96px`), `--sb-discovery-board-spacing` (what `spacing` sets, for a sandbox to set in its CSS instead) and `--sb-discovery-board-link` (a link's colour, set by its tone).

Classes: `sb-discovery-board` (`--across`, `--tracing`), `sb-discovery-board__flow`, `__column` (`--folded`), `__title`, `__toggle`, `__items`, `__item` (`--lit`, `--focus`), `__lines`, `__empty`. Each column carries `data-title`; each link's path carries `data-from`, `data-to` and `data-tone`, and each label `data-tone`.

**Folding shrinks the column, not what's in it.** Shrink your items in a folded column with your own CSS, keyed on `.sb-discovery-board__column--folded`, down to whatever identifies them, such as a code.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** column titles are buttons that fold and unfold, with `aria-expanded`; focus inside an item lights its chain as pointing does.
- **Layout:** links are measured when a chain is lit, so they follow wherever the items are; nothing waits on a resize.
- **Renaming:** if another component on the page is already called `sb-discovery-board`, the console says so. Replace every `sb-discovery-board` in `sb-discovery-board.js` (tag, classes and style id all use it) to give this copy a new name.
