# sb-json

JSON shown cleanly, with the parts that matter in the spotlight and everything else folded away. Use it wherever a sandbox talks about data: an API response, a message between services, a configuration, a record the model produces. Real payloads are long, and prose about them usually means a few lines; the spotlight shows just those lines, in place, with the structure around them.

The whole document is always inside. Viewers can unfold any gap, or show everything with the spotlit parts still marked. Clicking a line shows its path in a bar above the code, with the sandbox's note for it, so the JSON carries its own documentation.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-json/sb-json.js"></script>

<sb-json></sb-json>

<script>
  const json = document.querySelector('sb-json');
  json.value = {
    order: { id: 'A1', total: 2100, items: [{ sku: 'tea', qty: 2, price: 450 }] },
    customer: { name: 'Ada', email: 'ada@example.com' }
  };
  json.spotlight = ['order.total', 'order.items[0].price'];
  json.notes = { 'order.total': 'In pence, not pounds.' };
  json.addEventListener('sb-select', (e) => explain(e.detail.path));
</script>
```

## Paths

A path names a part of the document as code would reach it: `order.items[0].price`. Keys that aren't plain names are quoted in brackets: `order["gift wrap"]`. The whole document is `''`.

Paths are matched exactly as written, so copy them from the bar: click a line and its path is shown there. A path includes everything inside it, so spotlighting `order.items` shows the whole list.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `expanded` | off | Shows every line, with the spotlit ones still marked. Viewers switch it with the toggle in the bar. |
| `empty-text` | `No data yet.` | Shown when there is no value. |

## Properties

| Property | Meaning |
|---|---|
| `value` | Any JSON value. A copy is kept, as `JSON.stringify` would write it. To show JSON text, set `JSON.parse(text)`. Setting it folds any gaps the viewer opened. |
| `spotlight` | Paths that matter. Only these, and the lines that open and close around them, show; each run of other lines folds into a gap such as `⋯ 12 lines`, which a viewer can click to unfold. Empty shows everything. Setting it folds any opened gaps again. |
| `expanded` | Whether everything shows. Mirrors the attribute. |
| `notes` | `{ path: text }`. A noted path is marked with a small ring where it starts; its note shows under the bar when it's selected or pointed at. |
| `selected` | The selected path, or `null`. Its lines are shaded, and the bar shows it. |
| `highlight` | Paths to point at, shaded more strongly. One inside a folded gap marks the gap. |

Setting properties never fires the events below; they are for what viewers do.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ path, value, note }` | A viewer clicks a line, or presses Enter or Space on it. A container's opening and closing lines both select it. `note` is `null` without one. Bubbles. |
| `sb-toggle` | `{ expanded }` | A viewer shows everything, or folds it back, with the toggle. Bubbles. |

## Viewing

- **Pointing at a line** shades the part it belongs to and names its path in the bar, so a viewer sees what a click would select. Leaving shows the selection again.
- **The bar** shows the path pointed at or selected, and the toggle when there's a spotlight.
- **Line numbers** are the full document's, so they stay the same when lines fold.

## Keyboard

The code takes one Tab stop. Up and Down move through the lines and gaps; Home and End go to the first and last. Enter or Space selects a line, or unfolds a gap.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good` (strings), `--sb-warn` (numbers, `true`, `false`, `null`), `--sb-font`, `--sb-radius`.

Its own custom property, to set on the element: `--sb-json-height` (the code's greatest height before it scrolls; default none).

Classes: `sb-json__bar`, `sb-json__path` (`--empty`), `sb-json__toggle`, `sb-json__note`, `sb-json__code`, `sb-json__line` (`--spotlit`, `--selected`, `--hovered`, `--highlighted`, `--noted`), `sb-json__gap` (`--holds-highlight`), `sb-json__gutter`, `sb-json__text`, `sb-json__key`, `sb-json__string`, `sb-json__number`, `sb-json__literal`, `sb-json__punct`, `sb-json__empty`. Lines carry `data-path`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[The highlighting practice](../../practices/highlighting.md).** Use paths as refs. Route `sb-highlight` to `highlight` for words that point, and set `spotlight` for words that are clicked, so the prose narrows the JSON to what it's discussing.
- **[`sb-walkthrough`](../sb-walkthrough/manifest.md),** to step through a payload: on `sb-step`, set `spotlight` to the paths the step is about.
- **[`sb-sequence`](../sb-sequence/manifest.md) or [`sb-log`](../sb-log/manifest.md),** for messages: on `sb-select`, show the chosen message's body as `value`.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Size:** every line is drawn, which suits the hundreds of lines a sandbox shows. Very large documents would need drawing on demand.
- **Renaming:** if another component on the page is already called `sb-json`, the console says so. Replace every `sb-json` in `sb-json.js` to give this copy a new name.
