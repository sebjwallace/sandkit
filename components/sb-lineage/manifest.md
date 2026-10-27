# sb-lineage

Where things come from and what they lead to: the sandbox's own items in columns, in the order things flow, running across or down, with labelled links between them. Every link is drawn, and pointing at an item fades everything not linked to it; or links show only along the chain pointed at. Given a subject, it shows only what leads to it and what it leads to, and viewers follow items with a trail back. Viewers pan and zoom, or switch that off to scroll sideways, in the page or full screen. Columns fold down to make room. Use it for data lineage, requirements traced to tests, what a figure or decision rests on, or anything else where one thing rests on another.

The lineage knows nothing about what it holds. It places each child by its `data-ref`, in the column that lists it, and draws the links the sandbox gives it. Which items there are, which column each goes in and what each link means are the sandbox's to work out. The one thing it works out is a subject's lineage, by following the links it's given, so each sandbox doesn't write that walk again.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-lineage/sb-lineage.js"></script>

<sb-lineage>
  <div data-ref="M-1">…</div>
  <div data-ref="R-1">…</div>
</sb-lineage>

<script>
  const lineage = document.querySelector('sb-lineage');
  lineage.columns = [
    { title: 'Meters', refs: ['M-1'] },
    { title: 'Readings', refs: ['R-1'] },
  ];
  lineage.links = [{ from: 'M-1', to: 'R-1', label: 'records', tone: 'muted' }];
  lineage.subject = 'R-1';
  lineage.addEventListener('sb-select', (e) => showInPanel(e.detail.ref));
</script>
```

## Items

The lineage's children, each with a `data-ref`. It places each in the column that lists its ref, in that column's order, and leaves its content alone: it adds nothing to it. A child no column lists isn't shown. To change what's shown, replace the children, then set `columns` again.

Keep it readable: a few dozen items at most, chosen around what's being asked about, rather than everything the model holds. A subject does the choosing: give it every item and link, and it shows only the subject's lineage, with `back` and `on` to keep a broad one in bounds.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `links-shown` | `all` | `all`: every link drawn, always; pointing at an item fades everything not linked to it. `chain`: no links at rest; pointing at an item lights everything leading to it and everything it leads to, and draws only those links. |
| `direction` | `across` | `across`: the columns side by side, with room between them for links to turn and be labelled; it scrolls sideways when they don't fit. `down`: each column a band, its title on the left. |
| `spacing` | `96` across, `30` down | The room between columns going across, or between bands going down, in pixels. Give a busy lineage more, so its links have room to turn and be read. |
| `zoom` | `on` | `on`: viewers pan and zoom (see [Panning and zooming](#panning-and-zooming)), starting on the lineage as it is, at full size. `off`: it stays at full size and scrolls sideways. Viewers switch between them with a button; a sandbox chooses where it starts. |
| `fullscreen` | off | Lays the lineage over the whole page. Viewers go full screen and back with a button; Escape leaves it. |
| `back`, `on` | all | How many steps back from the subject, following links to what leads to it, and on from it, to what it leads to. Use `on` to keep a broad subject, such as a source most things rest on, from reaching nearly everything. |

## Properties and methods

| Member | Meaning |
|---|---|
| `columns` | `[{ title, refs, folded? }]`, in order. A column none of whose refs is shown is left out. `folded` starts it folded; once the viewer folds or unfolds a column, that's kept, by title, when the columns are set again. Setting it redraws. |
| `links` | `[{ from, to, label?, tone? }]`: from what something rests on to what rests on it, by ref. A link to anything not shown is left out. `tone` colours the line, its arrowhead, its dot and its label: `good`, `warn`, `bad`, `accent` (the default), `muted` or `text`, from the theme, so a lineage reads at a glance (what supports in good, what fails in bad, bookkeeping muted). Links sharing a label take the first one's tone for it. |
| `subject` | The ref being looked at, outlined: only it and its lineage are shown, everything that leads to it and everything it leads to, within `back` and `on` steps; links between any two of them are drawn. Setting a different one puts the one before on the trail, and scrolls the new one into view. `null` (the default) shows everything. |
| `trail` | Read only. The subjects looked at before this one, oldest first. Shown above the columns, with Back and the latest four as crumbs, whenever there's a subject or a trail. |
| `clearTrail()` | Forget the trail, for example when the lineage is opened afresh. |
| `linksShown`, `direction`, `spacing`, `back`, `on`, `zoom`, `fullscreen` | Mirror the attributes. `back` and `on` are `Infinity` when not set; `zoom` and `fullscreen` are `true` or `false`. |
| `fit()` | Zooms out, never past full size, until the whole lineage is in view, and centres it. The same as the Fit button. Does nothing with `zoom` off. |
| `highlight` | Refs to light from outside: those items stand out, nothing fades and the links stay as they are. Never redraws. |
| `reveal(ref)` | Unfolds the column holding `ref`, and returns whether the lineage shows it (see the [locating practice](../../practices/locating.md)). An item outside the subject's lineage isn't shown. |

Setting properties never fires the events below; they are for what viewers do.

## Pointing

Pointing at an item, or focus moving into it, outlines it and fades what isn't lit. Leaving the lineage, or pointing at its background, shows everything again.

- **With every link drawn,** the item's own links, their labels and the items at their other ends stay lit.
- **Along a chain,** everything that leads to it (following links backwards) and everything it leads to (forwards) is lit, and only the links along those two ways are drawn, so a side branch into the chain stays dark.

How links are drawn, so they stay readable:

- **No two links share a run.** All the links drawn are planned together: each leaves from its own point on its item's side and arrives at its own, every run across a gap has its own track, and links side by side run parallel, a few pixels apart, ordered so they don't cross where they can avoid it.
- **Routes run like a transit map,** square, with rounded corners, from a dot where a link leaves to an arrowhead where it arrives, in the gaps between columns.
- **Past a column, a link takes a lane clear of its items,** never behind one, so it can't be read as joining something it passes. Links going back take a lane beyond the items, so links running opposite ways never share a run.
- **Each side of an item is laid out as a whole.** Going across, links move on into an item's left side, and come back, or stay in their column, into its right; going down, they come into the top, or the bottom going back up. On each side, the links arriving and leaving are ordered by where they come from or head, so nothing crosses at the item, and centred on it.
- **Links of one label arrive side by side under one label:** beside a column, above them on the left and below them on the right, so labels in one gap face away from each other; along a band, after them. A label that would still crowd another moves along until it's clear.
- **Links follow the items.** They're redrawn whenever the items move: on folding, spacing, new columns or links, and when the lineage or its items change size.

## Panning and zooming

- **Starting:** the lineage as it is, at full size, top left; a new subject is brought just far enough into view.
- **Panning:** drag anywhere, items included, past the edges too. A drag never chooses an item; a click without moving does. Pressing an item's own controls uses them rather than dragging. Text in the items can't be selected meanwhile, since a drag always pans; with pan and zoom off, it selects as usual.
- **Zooming:** the − and + buttons at the bottom right, or Ctrl-scroll (⌘ on a Mac), which a trackpad pinch also sends, zooming at the pointer. Plain scrolling is left to the page. Viewers can zoom out until the whole lineage fits, and in to twice full size. Links are vector lines, so they stay sharp at any zoom.
- **Keyboard:** with the lineage focused, the arrow keys pan, + and − zoom, and 0 fits the whole lineage.
- **Full screen:** the button beside the zoom buttons lays the lineage over the whole page, with the subject, trail and view as they were, and back; Escape leaves it too. The element keeps its place in the page meanwhile, so nothing behind it moves. It stays inside the page rather than taking the browser's full screen, so a window it's in keeps working.
- **Height:** what the sandbox gives it, such as the whole of a full-screen window (set `--sb-lineage-max-height: none` too); otherwise its natural height, at most `70vh`.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ ref }` | A viewer clicks an item, or presses Enter in it. Show it in full, for example in a panel beside. Bubbles. |
| `sb-follow` | `{ ref }` | A viewer double-clicks an item, or presses Shift+Enter in it, to see its own lineage. Cancelable: unless prevented, it becomes the subject, with the one before on the trail. Prevent it to show the lineage another way, such as a new lineage in a window of its own. Bubbles. |
| `sb-back` | `{ ref }` | A viewer clicks Back or a crumb, and the lineage has gone back to that subject, forgetting the trail after it. Bubbles. |

Clicks and keys on controls inside an item (links, buttons, form fields, `summary`, `label`) are the item's own, and never select or follow it. Pointing and announcing are the sandbox's, from each item's `data-ref` (see the [highlighting practice](../../practices/highlighting.md)).

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-bg`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`, `--sb-font`. Its own: `--sb-lineage-max-height` (the most the panning area grows to while panning and zooming, `70vh`), `--sb-lineage-column` (a column's width going across, `170px`), `--sb-lineage-folded` (a folded column's width, `96px`), `--sb-lineage-spacing` (what `spacing` sets, for a sandbox to set in its CSS instead) and `--sb-lineage-link` (a link's colour, set by its tone).

Classes: `sb-lineage` (`--across`, `--pointing`, `--zoom`), `sb-lineage__box` (`--full`; the border around everything), `sb-lineage__trail`, `__back`, `__crumb`, `__separator`, `__current`, `__frame`, `__viewport` (`--dragging`), `__tools`, `__tool` (`--zoom`, `--switch`, `--full`), `__flow`, `__column` (`--folded`), `__title`, `__toggle`, `__items`, `__item` (`--lit`, `--focus`, `--subject`), `__lines`, `__link` (`--lit`), `__label` (`--lit`), `__empty`. Each column carries `data-title`. Each link carries `data-from`, `data-to` and `data-tone`; each label `data-tone` and `data-links`, the links it labels as `from>to`, separated by spaces.

**Folding shrinks the column, not what's in it.** Shrink your items in a folded column with your own CSS, keyed on `.sb-lineage__column--folded`, down to whatever identifies them, such as a code.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Touch:** dragging pans and the buttons zoom; pinching on a touch screen waits until a sandbox needs it.
- **Accessibility:** the panning area is focusable while panning and zooming, moved with the keys above, and the tools are labelled buttons, the switch with `aria-pressed`. Column titles are buttons that fold and unfold, with `aria-expanded`; focus inside an item lights it as pointing does, Enter selects it and Shift+Enter follows it. Make your items focusable (`tabindex="0"`) for the keyboard to reach them. The trail is a `nav` of buttons.
- **Refs** in links shouldn't contain spaces or `>`, since labels list their links with them.
- **Renaming:** if another component on the page is already called `sb-lineage`, the console says so. Replace every `sb-lineage` in `sb-lineage.js` (tag, classes and style id all use it) to give this copy a new name.
