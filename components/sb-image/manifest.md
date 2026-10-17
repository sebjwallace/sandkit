# sb-image

An image to zoom and pan, starting on just the part that matters, with boxes and pins marking what the prose is about. Use it wherever a sandbox explains something in a picture: a map, a site plan, a photograph, a scan, a diagram, a screenshot.

A large image usually holds far more than the sentence beside it means. The starting view shows only that part, as if cropped, with the whole image still inside for viewers to explore. Highlighting a mark glides the view to it and dims everything else, so words can steer the eye around the picture.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-image/sb-image.js"></script>

<sb-image src="images/site-plan.png" alt="The site plan"></sb-image>

<script>
  const image = document.querySelector('sb-image');
  image.view = { x: 0.2, y: 0.1, w: 0.5, h: 0.4 };
  image.marks = [
    { id: 'pump', x: 0.31, y: 0.22, w: 0.08, h: 0.06, label: 'Pump house' },
    { id: 'gate', x: 0.62, y: 0.35, label: 'Gate', tone: 'warn' }
  ];
  image.highlight = 'pump';
  image.addEventListener('sb-select', (e) => explain(e.detail.id));
</script>
```

## Places on the image

Everything is placed in fractions of the image: `x` from 0 at the left edge to 1 at the right, `y` from 0 at the top to 1 at the bottom, and `w` and `h` as shares of its width and height. Fractions keep marks in place if the image is swapped for a sharper copy.

To find a place, click it: `sb-point` reports where. The `shown` property reports the part in the frame, so a view can be found by zooming and panning to it.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `src` | none | The image: a file in the sandbox's folder, or an address on the web. Changing it starts again from the view. |
| `alt` | none | What the image shows, for people who can't see it. |
| `caption` | none | A line of text beneath the image. |
| `empty-text` | `No image yet.` | Shown without a `src`. |

## Properties

| Property | Meaning |
|---|---|
| `view` | The starting view, `{ x, y, w, h }`. Default the whole image. The frame takes its shape, so a crop sits in the page like an image of its own. Setting it again glides there and reshapes the frame; to move around without reshaping, highlight a mark. |
| `marks` | Boxes `{ id, x, y, w, h }` and pins `{ id, x, y }`, each with an optional `label` and `tone` (`good`, `warn` or `bad`). Labels show at a box's corner and beside a pin. |
| `highlight` | A mark's id, or `null`. The view glides to the mark and everything else dims: a box fits the frame with room around it, a pin is centred at twice the starting view's zoom. `null` glides back to `view`. |
| `shown` | Read only. The part of the image in the frame now, as `{ x, y, w, h }`, or `null` before the image loads. It can reach past the image where the frame is a different shape. |

Setting properties never fires the events below; they are for what viewers do.

## Methods

| Method | Meaning |
|---|---|
| `reset()` | Glides back to the highlighted mark, or else the view. The same as the circling arrow. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ id, mark }` | A viewer clicks a mark, or presses Enter or Space on it. Bubbles. |
| `sb-point` | `{ x, y }` | A viewer clicks the image anywhere but a mark, without dragging. Rounded to three decimal places. Bubbles. |

## Viewing

- **Zooming:** the + and − buttons, or Ctrl-scroll (⌘ on a Mac), which is also what a trackpad pinch sends. Plain scrolling is left to the page, so scrolling past an inline image still scrolls. Viewers can zoom out until the whole image fits, and in until one image pixel is eight screen pixels.
- **Panning:** drag. An image larger than the frame always covers it, so there is no empty space to pan into; along a side where it is smaller, it stays centred.
- **Back to the start:** the circling arrow returns to the highlighted mark, or else the view.
- **Moves the sandbox makes glide;** moves the viewer makes follow at once. Gliding is skipped when the viewer prefers reduced motion.

## Keyboard

The frame takes one Tab stop, then each mark. On the frame, + and − zoom, the arrow keys pan, and 0 goes back to the start. On a mark, Enter or Space selects it.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-surface`, `--sb-surface-2`, `--sb-border`, `--sb-accent`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-font`, `--sb-radius`.

Its own custom properties, to set on the element: `--sb-image-height` (a fixed height for the frame, instead of the view's shape; the view then fits inside it), `--sb-image-max-height` (default `70vh`).

Classes: `sb-image__frame` (`--dragging`), `sb-image__stage` (`--glide`), `sb-image__img`, `sb-image__marks`, `sb-image__mark` (`--box`, `--pin`, `--highlighted`, and the tone), `sb-image__label`, `sb-image__tools`, `sb-image__tool`, `sb-image__message`, `sb-image__caption`. Marks carry `data-id`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[The highlighting practice](../../practices/highlighting.md).** Use mark ids as refs and route `sb-highlight` to `highlight`, so pointing at a word glides to what it names.
- **[`sb-walkthrough`](../sb-walkthrough/manifest.md),** to tour a picture: on `sb-step`, set `highlight` to the step's ref.
- **[`sb-modal`](../sb-modal/manifest.md),** to open a large image over the page, or **[`sb-panel`](../sb-panel/manifest.md),** to let viewers pop it out.

## Notes

- **Dependencies:** none.
- **Export:** the component is safe for single-file export: a classic script that fetches nothing itself. The image is the sandbox's: a file in its folder can be packaged with it, but an address on the web needs a connection and won't be inside the packaged file.
- **Touch:** dragging pans; the buttons zoom. Pinching on a touch screen waits until a sandbox needs it.
- **Renaming:** if another component on the page is already called `sb-image`, the console says so. Replace every `sb-image` in `sb-image.js` to give this copy a new name.
