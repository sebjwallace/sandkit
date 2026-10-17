# sb-plane

A two-dimensional coordinate plane for vectors, points and shapes. Give it a matrix and a progress from 0 to 1, and space itself moves: the grid, the basis vectors and every object warp smoothly from no change to the full transformation, with the original grid left faintly behind for comparison. Vectors and points can be dragged.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-plane/sb-plane.js"></script>

<sb-plane range="4" basis snap="1"></sb-plane>

<script>
  const plane = document.querySelector('sb-plane');
  plane.objects = [
    { type: 'vector', id: 'v', x: 2, y: 1, label: 'v', draggable: true },
    { type: 'polygon', id: 'square', points: [[0, 0], [1, 0], [1, 1], [0, 1]], tone: 'warn' }
  ];
  plane.matrix = [[1, 1], [0, 1]];   // a shear
  plane.progress = 0.5;              // halfway there
  plane.addEventListener('sb-change', (e) => console.log(e.detail.id, e.detail.x, e.detail.y));
</script>
```

## Objects

| Field | Applies to | Meaning |
|---|---|---|
| `type` | all | `vector`, `point` or `polygon`. |
| `id` | all | Identifies the object, and is reported when it's dragged. |
| `x`, `y` | vector, point | Coordinates of the tip, or of the point. |
| `from` | vector | `[x, y]` where the vector starts. Defaults to the origin. Use it to draw vectors tip to tail. |
| `points` | polygon | `[[x, y], …]`, its corners in order. |
| `label` | all | Shown beside the tip, or as the polygon's tooltip. |
| `tone` | all | `accent` (default), `good`, `warn`, `bad`, `muted` or `text`. |
| `draggable` | vector, point | Lets viewers drag the tip or point. |
| `fixed` | all | Keeps the object where it is while space transforms around it. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `range` | `5` | Units from the origin to the nearer edge of the view. |
| `height` | `360` | The drawing's height in pixels. Its width is the element's width. |
| `basis` | off | Show î (green) and ĵ (red), moving with the transformation. |
| `snap` | off | Snap dragged coordinates to this step, such as `1` or `0.5`. |

## Properties

| Property | Meaning |
|---|---|
| `objects` | The objects to draw. Setting them copies the list. |
| `matrix` | The transformation `[[a, b], [c, d]]`. Its columns, `(a, c)` and `(b, d)`, are where î and ĵ land. |
| `progress` | From `0` (no change) to `1` (the full matrix). Between, the matrix is blended evenly from the identity. |
| `highlight` | A list of object ids to light up: thicker arrows, larger points, fuller shapes. Use it to point at objects from elsewhere, for example when a reference in the text is hovered (see the [highlighting practice](../../practices/highlighting.md)). |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-change` | `{ id, x, y }` | A draggable object is dragged. Coordinates are in the object's own space, before the transformation. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-accent`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Classes: `sb-plane__grid`, `sb-plane__axis`, `sb-plane__tick`, `sb-plane__moved-grid`, `sb-plane__moved-axis`, `sb-plane__shaft`, `sb-plane__head`, `sb-plane__dot`, `sb-plane__polygon`, `sb-plane__label`, `sb-plane__handle`. Tones are classes too, such as `sb-plane--good`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-parameters`](../sb-parameters/manifest.md),** to set a matrix's entries with sliders, or the transformation's progress.
- **[`sb-controls`](../sb-controls/manifest.md),** to play a transformation: step `progress` towards 1 on each tick.
- **[`sb-id`](../sb-id/manifest.md),** so prose can cite the vectors and transformations it discusses.

## Notes

- **The plane draws at its real width,** so grid cells stay square and text keeps its size.
- **Dragging moves an object by the pointer's movement,** taken back through the current transformation. While space is squashed flat (a determinant of zero), there's no way back, so dragging waits.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-plane`, the console says so. Replace every `sb-plane` in `sb-plane.js` to give this copy a new name.
