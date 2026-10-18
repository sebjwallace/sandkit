# sb-tabs

Tabs over a set of panels: the chapters of a sandbox, different views of a model, anything that is better seen one part at a time. Each panel is a direct child of the element, titled by its `heading`; only the selected panel shows. Panels stay in the page while hidden, so whatever happens in them is kept when viewers switch away and back.

A tab set only ever looks at its own direct children, so tab sets nest freely: a panel can hold another `<sb-tabs>` without either knowing about the other.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-tabs/sb-tabs.js"></script>

<sb-tabs id="chapters">
  <section heading="1 · Vectors">
    …the first chapter…
    <button type="button" onclick="this.closest('sb-tabs').next()">Next chapter →</button>
  </section>
  <section heading="2 · Combinations">…the second chapter…</section>
</sb-tabs>
```

## Panels

Every direct child is a panel. Give each a `heading` attribute: it becomes the tab's title. Panels added or removed later get or lose their tabs automatically. A panel without an `id` is given one, so its tab can point to it.

## Attributes

| Attribute | Meaning |
|---|---|
| `id` | Lets the tab set remember each viewer's choice. |
| `selected` | The index of the panel to show first, counting from 0. A viewer's remembered choice wins. |

## Properties and methods

| Member | Meaning |
|---|---|
| `panels` | The panels, in order. |
| `selected` | The index of the panel showing. Setting it shows that panel without firing `sb-select`. |
| `next()`, `previous()` | Move one panel along, stopping at the ends. Fires `sb-select`. |
| `reveal(ref, place)` | Show the panel holding `place`, an element on the page, or without one the first panel holding a part marked `data-ref="ref"` (or marked so itself). Quiet, as setting `selected` is: no `sb-select`, and not remembered as the viewer's choice. Returns `true`, or `false` if no panel holds it. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ index, heading }` | The viewer chooses a panel, by tab, keyboard, `next()` or `previous()`. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-accent`.

Classes: `sb-tabs__list`, `sb-tabs__tab`. The selected tab has `aria-selected="true"`. Panels have `role="tabpanel"`, and the `hidden` attribute while not shown.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[The locating practice](../../practices/locating.md).** A sandbox's `goTo` calls `reveal` on every tab set around the place it's going to, so a ref in a hidden chapter opens it.
- **Chapters of a sandbox,** one panel each, with a "Next chapter" button at the end of each calling `next()`.
- **[`sb-panel`](../sb-panel/manifest.md),** around a tab set that viewers may want to float beside the rest of the sandbox.
- **[`sb-chart`](../sb-chart/manifest.md) and [`sb-plane`](../sb-plane/manifest.md)** in hidden panels redraw at their real width when their panel is shown.

## Notes

- **Keyboard:** arrow keys move between tabs (wrapping round), Home and End jump to the ends, and only the selected tab is reached with the Tab key.
- **A hidden panel stays hidden** even if the sandbox styles it with a display of its own.
- **`data-ref` is the one thing a tab set looks for in its panels,** and only for `reveal` without a place. It shows its panels' content without otherwise inspecting it.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-tabs`, the console says so. Replace every `sb-tabs` in `sb-tabs.js` to give this copy a new name.
