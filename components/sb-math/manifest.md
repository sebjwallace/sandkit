# sb-math

Mathematics people can point into. `sb-math` wraps ordinary MathML, which every modern browser draws natively, with no library and no fonts to bundle. Any part of the expression marked `data-ref="…"` announces a highlight when hovered or focused, and lights up whenever the same ref is announced from anywhere else on the page.

Follows the [highlighting practice](../../practices/highlighting.md). Read that first: it covers refs, the page-wide `sb-highlight` event, and wiring other components in.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-math/sb-math.js"></script>

<sb-math>
  <math display="block">
    <mi>A</mi><mo>·</mo><mi>v</mi><mo>=</mo>
    <mn data-ref="x">2</mn><mo>·</mo><mrow data-ref="i-hat"><mi>î</mi></mrow>
    <mo>+</mo>
    <mn data-ref="y">1</mn><mo>·</mo><mrow data-ref="j-hat"><mi>ĵ</mi></mrow>
  </math>
</sb-math>
```

Write the MathML as usual. Mark the parts people should be able to point at with `data-ref`; group a part with `<mrow>` when it is more than one element.

## Content

| Marking | Meaning |
|---|---|
| `data-ref="name"` on any MathML element | The part announces `name` when hovered or focused, and lights up when `name` is announced. |

The sandbox can change the MathML at any time, for example to show new numbers. Marked parts added later work like the rest.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-highlight` | `{ ref }` | Fired on `document` when a marked part starts being pointed at, and with `ref: null` when pointing stops. Moving straight from one marked part to another announces the new one without a `null` in between. |

## Styling

Theme tokens: `--sb-accent`, `--sb-accent-soft`.

Classes: lit parts carry `sb-math--lit`. Marked parts show a help cursor and a focus outline.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-id`](../sb-id/manifest.md) pills in the prose,** with codes matching the equation's refs: hovering either lights the other.
- **[`sb-matrix`](../sb-matrix/manifest.md) and [`sb-plane`](../sb-plane/manifest.md),** lit through the sandbox as the highlighting practice shows, so a term, a column and an arrow light up together.

## Notes

- **MathML is native to every modern browser,** so nothing needs loading, and the expression survives single-file export.
- **Keyboard:** marked parts can be reached with Tab, and announce when focused.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-math`, the console says so. Replace every `sb-math` in `sb-math.js` to give this copy a new name.
