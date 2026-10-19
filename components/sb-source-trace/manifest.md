# sb-source-trace

Why something in a model is there, as one graph flowing left to right. Choose a rule, a figure, an assumption or a part of a screen, and the trace draws everything it rests on to its left, back to the sources and what they were derived from, and everything resting on it to its right. Use it wherever people ask "says who?" of a sandbox: a button in a wireframe, a parameter in a model, a rule in a table.

Sources are drawn as small sheets of paper; the model's items as plain boxes. Clicking a source asks the sandbox to open it; clicking an item traces from it instead, with a trail and Back. Unknown ids, loops and items resting on nothing cited are drawn where they are, never hidden. It follows the [sources practice](../../practices/sources.md), which says how items cite passages.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-source-trace/sb-source-trace.js"></script>

<sb-source-trace></sb-source-trace>

<script>
  const trace = document.querySelector('sb-source-trace');
  trace.items = model.items;
  trace.catalogue = catalogue.sources;     // the page loads the catalogue; the component never fetches
  trace.subject = 'SCR-3';
  trace.addEventListener('sb-open', (e) => openSource(e.detail.id));
</script>
```

## Data

**`items`** are the model's items, as the sources practice describes: `{ id, title, kind, sources: [citation], restsOn: [id] }`. A citation is `{ source, quote }`, `{ source, page, quote }`, `{ source, region }` or `{ source, annotation }`, with an optional `note`.

**`catalogue`** is the catalogue's `sources`. Only `id`, `title`, `path`, `format` and `derivedFrom` are used.

The graph around the subject holds:

| Behind it (to the left) | Ahead of it (to the right) |
|---|---|
| The items it rests on, all the way back; the sources they cite; and the sources those were derived from. | Everything resting on it, all the way forward. For a source: the sources derived from it, the items citing any of them, and what rests on those. |

Lines run the way material flows: from a source to what cites it or was derived from it, and from an item to what rests on it. Each node sits right of everything it rests on; a line skipping columns passes through gaps between the boxes, never behind one.

## Properties and methods

| Member | Meaning |
|---|---|
| `items`, `catalogue` | The model and the catalogue. Copied when set. |
| `subject` | The id being traced, outlined in the graph. Setting a different one puts the one before on the trail. Without one, the component says "Choose something to see where it comes from." |
| `trail` | Read only. The subjects traced before this one, oldest first. The latest few show as crumbs, with Back. |
| `clearTrail()` | Forget the trail, for example when the trace is opened afresh. |
| `highlight` | Ids to light up, with the lines touching them: `['SRC-2']`. Until something is lit or pointed at, the subject's lines are. |
| `result` | Read only. The latest trace, as `traceSources` returns it. |

**Static:** `customElements.get('sb-source-trace').traceSources({ items, catalogue }, ref)` returns the graph as plain JSON, with no element on the page: `{ subject, nodes, edges, missing, cycles, unsupported }`. Nodes are `{ id, type, title, kind, derived, column }` with `type` `source`, `item` or `missing`; edges are `{ from, to, kind, citations, cycle }` with `kind` `cites`, `derived` or `rests`. It also runs from Node: `node tools/analyse.mjs trace items.json sources/catalogue.json --ref SCR-3 --md`, taking files holding `items` and the catalogue's `sources`.

Setting properties never fires the events below; they are for what viewers do.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-open` | `{ id }` | A viewer clicks a source. Open it, for example in [`sb-source`](../sb-source/manifest.md) in a modal. The trace stays as it is. Bubbles. |
| `sb-follow` | `{ id }` | A viewer clicks an item, and the trace has moved to it. Bubbles. |
| `sb-back` | `{ id }` | A viewer clicks Back or a crumb, and the trace has gone back to that subject. Bubbles. |
| `sb-point` | `{ id }`, `id` `null` when pointing stops | A viewer points at a node (hover or focus). Bubbles. |

## What it shows

- **The summary:** "5 sources and 6 items lead to SCR-3, citing 8 passages; 2 items rest on it", then the problems in red.
- **Unknown ids** (named by `restsOn` or a citation, but in neither the model nor the catalogue) are dashed red boxes saying what named them, with a dashed red line.
- **Loops** in `restsOn` are drawn as dashed red lines swinging below, and the rest is laid out as if they weren't there.
- **Items behind the subject resting on nothing cited** are marked "Nothing cited". An item that cites nothing is a finding, as the sources practice says.
- **Big graphs scroll** in both directions rather than shrink; the trace opens scrolled just far enough to show the subject. The full screen button in the title row gives it the whole screen, and retracing keeps it there.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-bg`, `--sb-accent`, `--sb-accent-soft`, `--sb-warn`, `--sb-bad`, `--sb-radius`, `--sb-font`. Its own: `--sb-source-trace-paper` (the sources' paper, warm by default), `--sb-source-trace-font` (the typeface for their titles, a serif by default) and `--sb-source-trace-fold` (the folded corner's size, `12px`).

Classes: `sb-source-trace__trail`, `sb-source-trace__back`, `sb-source-trace__crumb`, `sb-source-trace__head`, `sb-source-trace__title`, `sb-source-trace__kind`, `sb-source-trace__full`, `sb-source-trace__summary`, `sb-source-trace__problems`, `sb-source-trace__graph` (the scrolling area), `sb-source-trace__canvas`, `sb-source-trace__flow` (`--lit`, `--cycle`, `--missing`; carries `data-from` and `data-to`), `sb-source-trace__line`, `sb-source-trace__arrow`, `sb-source-trace__node` (`--source`, `--item`, `--missing`, `--subject`, `--unsupported`, `--lit`), `sb-source-trace__id`, `sb-source-trace__tag`, `sb-source-trace__name`, `sb-source-trace__empty`.

Each node carries `data-ref` with its id, so a sandbox can find it (see the [locating practice](../../practices/locating.md)).

Give the element a height (for example `height: 70vh`) so a big graph scrolls inside it, or leave it to grow with its content.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-modal`](../sb-modal/manifest.md)** to open the trace over the page when someone asks why a thing is there, and a second modal over it for the source.
- **[`sb-source`](../sb-source/manifest.md)** to open a source on `sb-open`: set its `source`, the file's `content` or `url`, and as `passages` every citation of that source in `model.items`, so all the words the model rests on are marked.
- **[`sb-trace-mode`](../sb-trace-mode/manifest.md),** Trace in the shell's mode picker: while it's on, pointing outlines anything whose `data-ref` is in `model.items`, and a click asks for the trace instead of acting. Open this in an `sb-modal` on its `sb-pick`. `examples/control-room/` shows it.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, and announce `sb-point` ids, so pointing at a node lights the same thing elsewhere on the page.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Computes:** the tracing is an exception to "components render, models compute", approved for this component, since following chains, derivations and loops the same way in every sandbox is easy to get wrong. It only follows the model's links; it never judges them.
- **Readability:** a trace is for one thing at a time. A model whose items each rest on a long chain makes wide graphs; split such a model into smaller items, or trace from the middle.
- **Trust:** a catalogue's and model's text is only ever shown as text.
- **Renaming:** if another component on the page is already called `sb-source-trace`, the console says so. Replace every `sb-source-trace` in `sb-source-trace.js` (tag, classes, tokens and style id all use it) to give this copy a new name.
