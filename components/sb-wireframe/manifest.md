# sb-wireframe

A wireframe prototype written in plain HTML: a single screen, or a flow of screens to click through. Use it wherever a sandbox involves what people see and do: the screens of a system being modelled, a form whose fields feed the model, or the steps of a journey a sequence or flowchart describes.

Write the screens as ordinary HTML inside the element. It draws them as a wireframe, shows one screen at a time, moves between them on click, and lets the sandbox point at any part. The sandbox owns the markup, so it changes what the screens say (a basket count, an error) by changing its own elements.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-wireframe/sb-wireframe.js"></script>

<sb-wireframe>
  <section data-screen="basket" heading="Basket">
    <h2>Your basket</h2>
    <div class="sb-wireframe__row">
      <div class="sb-wireframe__image" style="width: 80px"></div>
      <div class="sb-wireframe__text" style="flex: 1"></div>
    </div>
    <button class="sb-wireframe__primary" data-go="pay" data-ref="checkout">Checkout</button>
  </section>
  <section data-screen="pay" heading="Payment">
    <form class="sb-wireframe__stack">
      <input placeholder="Card number" data-ref="card">
      <button class="sb-wireframe__primary" data-go="done">Pay</button>
    </form>
  </section>
  <section data-screen="done" heading="Done"><h2>Thank you</h2></section>
</sb-wireframe>

<script>
  const wireframe = document.querySelector('sb-wireframe');
  wireframe.addEventListener('sb-navigate', (e) => model.reachScreen(e.detail.screen));
  wireframe.addEventListener('sb-select', (e) => console.log('Clicked', e.detail.ref));
</script>
```

## Markup

| Mark | On | Meaning |
|---|---|---|
| `data-screen="id"` | a direct child | Makes it a screen; only one shows at a time. Without any, everything inside is one screen. |
| `heading` | a screen | Its name in the bar of screens. Defaults to its id. |
| `data-go="id"` | any element | Clicking it moves to that screen. Use it on buttons and links, so the keyboard reaches it. |
| `data-ref="name"` | any element | A part that can be pointed at, highlighted, revealed and clicked. Several parts may share a ref. |

Plain HTML elements (headings, paragraphs, buttons, inputs, selects, links, rules) are drawn as a wireframe. Lay screens out with ordinary HTML and CSS, or these helpers:

| Class | Draws |
|---|---|
| `sb-wireframe__row` | Children side by side, wrapping, with a gap. |
| `sb-wireframe__stack` | Children one above another, with a gap. |
| `sb-wireframe__box` | An outlined panel, such as a card. |
| `sb-wireframe__image` | An image placeholder: a box with a cross. Give it a size. |
| `sb-wireframe__text` | Placeholder text as grey lines. Three lines by default; give it a height for more. |
| `sb-wireframe__primary` | The main action, in the accent colour. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `screen` | the first | The screen to show. |

## Properties and methods

| Member | Meaning |
|---|---|
| `screen` | The id of the screen showing, or `null` with no screens. An unknown id shows the first. Setting it doesn't fire `sb-navigate`. |
| `screens` | The screen elements, in order. |
| `highlight` | The refs to point at: `['checkout']`. Every part with one is outlined; a part on another screen marks that screen in the bar. |
| `reveal(ref)` | Goes to the screen holding the part, and highlights it. |

## Viewers

- **Clicking** a `data-go` element, or a screen in the bar, moves to that screen. Forms never submit and `data-go` links never follow their `href`.
- **Pointing** at a part (hover or focus) outlines every part with its ref, and fires `sb-point`.
- **Typing** into inputs works as normal; listen for `input` on the element to feed the model.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-navigate` | `{ screen, from }` | A viewer moves to another screen. Bubbles. |
| `sb-select` | `{ ref, screen }` | A part is clicked, with the screen it was on. Fires before `sb-navigate` when the part also has `data-go`. Bubbles. |
| `sb-point` | `{ ref }`, `ref` `null` when pointing stops | A viewer points at a part, or away. Bubbles. |

## Styling

Set these on the element, or in an `sb-wireframe { … }` rule, to give the wireframe a look of its own. Each falls back to the theme.

| Token | Colours | Default |
|---|---|---|
| `--sb-wireframe-paper` | The screen's background. | `--sb-surface` |
| `--sb-wireframe-ink` | Text. | `--sb-text` |
| `--sb-wireframe-line` | Outlines and rules. | `--sb-muted` |
| `--sb-wireframe-fill` | Inputs, placeholders and the bar. | `--sb-surface-2` |
| `--sb-wireframe-accent` | Primary buttons. | the ink |
| `--sb-wireframe-accent-text` | Text on primary buttons. | the paper |
| `--sb-wireframe-font` | The font, such as a handwritten one for a sketchier look. | `--sb-font` |

Pointing and highlighting use the theme's `--sb-accent` and `--sb-accent-soft`, so they read the same as in every other component.

Classes: the helpers above, `sb-wireframe__bar`, `sb-wireframe__step` (the showing one has `aria-current="true"`; `--holds-highlight`), and `sb-wireframe--pointed` and `sb-wireframe--highlighted` on parts. The content's own styles are deliberately weak, so any class of the sandbox's wins.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-sequence`](../sb-sequence/manifest.md) or [`sb-flowchart`](../sb-flowchart/manifest.md),** for what happens behind a screen: on `sb-navigate` or `sb-select`, set the diagram's current message or step; when the diagram moves, `reveal` the part that starts it.
- **[`sb-log`](../sb-log/manifest.md),** to record each click and move as the viewer works through the flow.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-point` refs into `sb-highlight`, and `sb-highlight` refs to `highlight`, so prose and diagrams can point at a button and the button at them.

## Notes

- **Not yet:** device frames, a sketchier hand-drawn look, and a map of how the screens link wait until a sandbox needs them.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-wireframe`, the console says so. Replace every `sb-wireframe` in `sb-wireframe.js` to give this copy a new name.
