# sb-walkthrough

A story told across several views, one step at a time. Use it when no single view explains something on its own: a screen, an architecture, the code behind it and the messages between them, or a diagram and the measurements it explains. The narration takes the reader from one view to the next, outlining the view to look at and naming the parts to highlight inside it.

The walkthrough knows nothing about the views. It lays them out, outlines them, and tells the sandbox which refs each step highlights; the sandbox passes those on to the components inside, as in the [highlighting practice](../../practices/highlighting.md).

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-walkthrough/sb-walkthrough.js"></script>

<sb-walkthrough style="height: 640px">
  <section data-step data-focus="screen" data-highlight="pay">
    <p>The shopper presses <span data-ref="pay">Pay</span>.</p>
  </section>
  <section data-step data-focus="code" data-highlight="charge" data-line="4">
    <p>The server asks the provider to <span data-ref="charge" data-focus="code">charge the card</span>.</p>
  </section>

  <div slot="screen">…a wireframe…</div>
  <div slot="code">…code…</div>
</sb-walkthrough>

<script>
  const walk = document.querySelector('sb-walkthrough');
  const show = ({ highlight, element }) => {
    screen.highlight = highlight;
    code.step = Number(element.dataset.line ?? 0);
  };
  show(walk.current);
  walk.addEventListener('sb-step', (e) => show(e.detail));
  walk.addEventListener('sb-point', (e) => { screen.highlight = e.detail.ref ? [e.detail.ref] : walk.current.highlight; });
</script>
```

## Markup

| Mark | On | Meaning |
|---|---|---|
| `data-step` | a direct child | A step of the narration. Shown one at a time, in order. Write anything inside: paragraphs, lists, maths. |
| `slot="name"` | a direct child | A view, laid out beside the narration. One to four work well. Any element: a panel, a component, a plain block. |
| `data-focus="name …"` | a step | The views to look at in this step, outlined. |
| `data-highlight="ref …"` | a step | The refs to highlight in this step, reported to the sandbox. |
| `data-*` | a step | Anything else the step should set, such as a screen or a line of code; read it from `element.dataset`. |
| `data-ref="ref"` | a word in a step | Pointing at it fires `sb-point`. Drawn with a dashed underline. |
| `data-focus="name …"` | a word in a step | While pointed at, outlines these views instead of the step's. |

## Layout

The narration sits on the left, or along the bottom with `narration="bottom"`. The views fill the rest: one fills it; two stack (beside bottom narration, they sit side by side); three put the first large with two beside it; four make two by two. Give the element a height; it is 640px by default.

Each view is placed in a cell of its own, framed like the narration, with a gap between cells. A view that leaves something behind when it moves out of the page, such as a panel that pops out and leaves a placeholder, keeps that in its place. Outlines are drawn on the view itself, so they follow it.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `narration` | `left` | Or `bottom`. |
| `step` | `0` | The step to start at. |

## Properties and methods

| Member | Meaning |
|---|---|
| `step` | The index of the step showing. Setting it doesn't fire `sb-step`. |
| `current` | `{ step, focus, highlight, element }` for the step showing: apply it once at the start, and whenever the sandbox sets `step`. |
| `steps`, `views` | The step and view elements, in order. |
| `next()`, `previous()` | Move as a viewer would, firing `sb-step`. |

## Viewers

- **Back and Next,** or the arrow keys while the narration has focus, move through the steps.
- **Pointing** at a marked word (hover or focus) fires `sb-point`, and outlines the word's own views if it names any.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-step` | `{ step, focus, highlight, element }`, as `current` | A viewer moves to another step. Bubbles. |
| `sb-point` | `{ ref }`, `ref` `null` when pointing stops | A viewer points at a marked word, or away. Put back the step's highlight on `null`. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-text`, `--sb-radius`. Sizes: `--sb-walkthrough-width` (the narration on the left, 320px) and `--sb-walkthrough-height` (the most the narration along the bottom takes, 240px).

Classes: `sb-walkthrough__narration`, `sb-walkthrough__steps`, `sb-walkthrough__controls`, `sb-walkthrough__count`, `sb-walkthrough__button` (`--next`), `sb-walkthrough__views` (with `data-count`), `sb-walkthrough__view` (a cell), and `sb-walkthrough--focused` on outlined views.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-tour`](../sb-tour/manifest.md),** where something else fits: a tour points at the page as it already is, one part at a time and anywhere on it, while a walkthrough lays out its own views and tells a story across them.
- **[`sb-panel`](../sb-panel/manifest.md)** as each view, so readers can pop one out, enlarge it, and keep following the story.
- **Any component with a `highlight`,** such as [`sb-wireframe`](../sb-wireframe/manifest.md), [`sb-c4`](../sb-c4/manifest.md), [`sb-sequence`](../sb-sequence/manifest.md) or [`sb-flowchart`](../sb-flowchart/manifest.md): pass each step's `highlight` to them, translating refs where a component wants another shape.
- **Components that step,** such as [`sb-code`](../sb-code/manifest.md) or [`sb-sequence`](../sb-sequence/manifest.md)'s `current`: carry the position on the step as a `data-` attribute and set it on `sb-step`.

## Notes

- **One story, many views:** steps should each say one thing and point at it. Five to ten steps is plenty for one walkthrough.
- **Not yet:** a table of contents, steps that play by themselves, and remembering a reader's place wait until a sandbox needs them.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** the steps are announced as they change; Back and Next are buttons.
- **Renaming:** if another component on the page is already called `sb-walkthrough`, the console says so. Replace every `sb-walkthrough` in `sb-walkthrough.js` to give this copy a new name.
