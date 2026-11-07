# Your own parts

A diagram drawn in SVG, a phrase in the prose, a card the sandbox lays out itself: these point, light up and are found like everything else, once they're named. Part of the [highlighting practice](highlighting.md).

## Name what a part is

Give every part that stands for a thing in the model `data-ref` with that thing's id. That one attribute lets it light up, and lets `placesOf` find it, `refsAt` cite it in comments, and tours and cross-references go to it (see the [locating practice](locating.md)).

- **On the part's outermost element:** the `<g>` in SVG, the `<span>` around a phrase, the card's root.
- **Never inside a component.** It redraws whenever it likes. Route to its `highlight` instead (see [Wiring](highlighting-wiring.md)).
- **A part that goes somewhere is a link:** keep its target in `data-go`, call `goTo` on click, and let `data-points-at` preview it. Make it a button, or in SVG give it `role="button"` and `tabindex="0"`.

## Look like the components

The script lights your parts for you. Two things are yours:

- **Draw shapes so a stroke shows.** On SVG, the script strokes a part's own shapes, the direct children of its `<g>`, or the shape itself if that carries the `data-ref`. A shape filled in the accent shows it less.
- **Colour through classes, not attributes.** A class in `style.css` is easy to change; `fill="#c33"` is not.

## In SVG

- **Group each thing's shapes and label in a `<g>`** carrying its `data-ref`, so pointing at any of it counts. Its `<title>` gives a tooltip for free.
- **Give thin lines a wider target:** a `.hit` path along the line, drawn before it. Otherwise no one can point at an edge.
- **Keep labels readable over lines** with a halo: `paint-order: stroke; stroke: var(--sb-surface); stroke-width: 4px`.
- **Scope your SVG styles to your drawing** (`#warehouse-map text`, not `svg text`), or they reach into components' diagrams.
- **`tabindex="0"` and an `aria-label`** on parts people should reach without a mouse.
- **Prefer SVG to canvas** for anything people point at: a canvas's parts can't carry `data-ref`.

## If a part hides things

A part that folds or switches, such as a `<details>`, offers `reveal(ref)` as a plain property, so `goTo` can open it:

```js
const assumptions = document.querySelector('#assumptions');
assumptions.reveal = (ref) => {
  if (!assumptions.querySelector(`[data-ref="${CSS.escape(ref)}"]`)) return false;
  assumptions.open = true;
  return true;
};
```

It never selects, never fires viewers' events, and never undoes a viewer's choice. Give each container a `heading` (`<figure id="warehouse-map" heading="Warehouse map">`) so cross-references name its places as readers know them.

When a part is used in more than one chapter or page, make it one of the sandbox's own components (see the [domain components practice](domain-components.md)), with `data-ref`, `highlight` and `reveal` like Sandkit's.
