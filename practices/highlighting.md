# Highlighting

How to let people point at one thing and see it light up everywhere it appears: in the prose, in an equation, in a diagram, in a table. Hover a reference to "the first column" in a sentence, and the first column of the matrix, the matching term of the equation and the arrow it becomes all light up together.

Read this before using [`sb-math`](../components/sb-math/manifest.md) or the pointing behaviour of [`sb-id`](../components/sb-id/manifest.md).

## Why it matters

Explanations refer to things: this term, that arrow, the second rule. Readers have to hold the connection in their heads, matching words to symbols to pictures. Lighting up every appearance of the thing being pointed at makes the connection visible, and lets people check their understanding just by moving the pointer.

## The protocol

One page-wide event, `sb-highlight`, fired on `document`:

```js
document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref: 'i-hat' } }));  // pointing at î
document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref: null } }));     // pointing at nothing
```

- **A ref is a short name for a thing,** such as `i-hat`, `col-1` or `RUL-003`. Use the thing's code where it has one (see the [identifiers practice](identifiers.md)).
- **Announce a ref** when something starts being pointed at (hover or keyboard focus), and `null` when it stops.
- **Light up** whatever you've marked with the announced ref, and clear it on `null` or a different ref.

No component knows about any other. Each just announces, or listens, or both.

## Who takes part

| Part | Announces | Lights up |
|---|---|---|
| [`sb-id`](../components/sb-id/manifest.md) | its code, while hovered or focused | itself, when its code is announced |
| [`sb-math`](../components/sb-math/manifest.md) | the `data-ref` of the part hovered or focused | every part marked with the announced ref |
| [`sb-xref`](../components/sb-xref/manifest.md) | the ref of the place or link hovered or focused | — |
| Other components | — | through the sandbox, below |

## Wiring the rest

Components such as `sb-plane`, `sb-matrix` and `sb-graph` have their own highlight properties but don't listen for the event themselves. The sandbox routes refs to them with one listener:

```js
const HIGHLIGHTS = {
  'i-hat': () => { matrix.highlight = { columns: [0] }; plane.highlight = ['i-hat']; },
  'j-hat': () => { matrix.highlight = { columns: [1] }; plane.highlight = ['j-hat']; }
};

document.addEventListener('sb-highlight', (e) => {
  matrix.highlight = {};
  plane.highlight = [];
  HIGHLIGHTS[e.detail.ref]?.();
});
```

Most of these components don't announce either: pointing at an `sb-c4` box lights its neighbours inside the diagram, and nothing else. Their parts carry `data-ref` (see the [locating practice](locating.md)), so the sandbox announces for them with two lines on the component itself:

```js
diagram.addEventListener('pointerover', (e) => announce(e.target.closest('[data-ref]')?.dataset.ref ?? null));
diagram.addEventListener('pointerleave', () => announce(null));
```

For the sandbox's own elements, see "Your own parts" below.

## Your own parts

Components can't cover everything. A diagram drawn in SVG, a phrase in the prose, a card the sandbox lays out itself: these should point, light up and be found like everything else.

### Name what a part is

Give every part that stands for a thing in the model `data-ref` with that thing's id, as components do. That one attribute lets `placesOf` find it, `refsAt` cite it in comments, and tours and cross-references go to it (see the [locating practice](locating.md)).

- **On the part's outermost element:** the `<g>` in SVG, the `<span>` around a phrase, the card's root.
- **Never inside a component.** Add nothing to what a component draws: it redraws whenever it likes. Route to its `highlight` instead, as above.

### Point and light up with one helper

Write this once in the page script, beside `announce`, and call it for each container of the sandbox's own parts:

```js
// Pointing at the sandbox's own parts in `root`: announces a part while it's pointed at or focused,
// and lights every part with the announced ref. Components inside root point and light up themselves.
function pointable(root) {
  // The sandbox's own part an element is in, or null if it's in none, or inside a component.
  const partAt = (el) => {
    const part = el?.closest('[data-ref]');
    if (!part || !root.contains(part)) return null;
    for (let at = part; at !== root; at = at.parentElement) if (at.localName.startsWith('sb-')) return null;
    return part;
  };
  // Arriving at a part announces it; leaving ends the highlight, unless it went straight to another part.
  const arrive = (e) => {
    const part = partAt(e.target);
    if (part && part !== partAt(e.relatedTarget)) announce(part.dataset.ref);
  };
  const leave = (e) => { if (partAt(e.target) && !partAt(e.relatedTarget)) announce(null); };
  root.addEventListener('pointerover', arrive);
  root.addEventListener('focusin', arrive);
  root.addEventListener('pointerout', leave);
  root.addEventListener('focusout', leave);

  document.addEventListener('sb-highlight', (e) => {
    for (const part of root.querySelectorAll('[data-ref]')) {
      if (partAt(part) === part) part.classList.toggle('is-lit', part.dataset.ref === e.detail.ref);
    }
  });
}

pointable(document.querySelector('#warehouse-map'));
pointable(document.querySelector('main'));   // phrases in the prose
```

- **Components inside are left alone,** so an `sb-id` pill or an `sb-math` term in the prose keeps announcing itself, once.
- **Moving between parts** announces the next one with no `null` between, so nothing flickers.
- **`is-lit` is the sandbox's own class,** styled in `style.css` (below). `sb-` belongs to Sandkit.
- **A part that goes somewhere is a link,** as in the locating practice: keep its target in `data-go`, call `goTo` on click, and point with `announce`. Make it a button, or in SVG give it `role="button"` and `tabindex="0"`, so the keyboard reaches it.

### Look like the components

Light parts with the theme's accent, never fixed colours, as `sb-math` and `sb-wireframe` do:

```css
.is-lit { background: var(--sb-accent-soft); color: var(--sb-accent); border-radius: 3px; }
svg .is-lit .shape { fill: var(--sb-accent-soft); stroke: var(--sb-accent); stroke-width: 3; }
svg .is-lit .line { stroke: var(--sb-accent); stroke-width: 3; }
.hit { fill: none; stroke: transparent; stroke-width: 12; }
```

- **Colour through classes, not attributes.** A shape drawn with `fill="#c33"` can't be lit; `class="shape"` with its colour in `style.css` can.
- **Lit outranks tone.** A lit part shows as lit even when it also carries a warning colour.

### In SVG

- **Group each thing's shapes and label in a `<g>`** carrying its `data-ref`, so pointing at any of it counts. Its `<title>` gives a tooltip for free.
- **Give thin lines a wider target:** a `.hit` path along the line, drawn before it, as `sb-c4` does. Otherwise no one can point at an edge.
- **Keep labels readable over lines** with a halo in the colour behind them (`paint-order: stroke; stroke: var(--sb-surface); stroke-width: 4px`), as `sb-c4` does.
- **Scope your SVG styles to your drawing** (`#warehouse-map text`, not `svg text`), or they reach into components' diagrams too.
- **`tabindex="0"` and an `aria-label`** on parts people should reach without a mouse.
- **Prefer SVG to canvas** for anything people point at: a canvas's parts can't carry `data-ref`, so they can't be found.

### If a part hides things

A part that folds or switches, such as a `<details>`, offers `reveal(ref)` as a plain property, so `goTo` can open it:

```js
const assumptions = document.querySelector('#assumptions');
assumptions.reveal = (ref) => {
  if (!assumptions.querySelector(`[data-ref="${CSS.escape(ref)}"]`)) return false;
  assumptions.open = true;
  return true;
};
```

The locating practice's rules apply: it never selects, never fires viewers' events, and never undoes a viewer's choice. Give each container a `heading` (`<figure id="warehouse-map" heading="Warehouse map">`) so cross-references name its places as readers know them.

When a part is used in more than one chapter or page, make it the sandbox's own component (see [building a sandbox](building-a-sandbox.md)), with `data-ref`, `highlight` and `reveal` like Sandkit's.

## Pointing shows, clicking acts

People point to look and click to do, so keep the two apart everywhere in a sandbox:

- **Pointing** (hover or keyboard focus) only lights things up, and clears when the pointer leaves.
- **Clicking** does something lasting: selects, navigates, steps the model.

Words in the prose show which they are:

```css
.point { border-bottom: 1px dashed var(--sb-accent); cursor: default; }   /* point at me */
.act   { border-bottom: 1px solid var(--sb-accent); cursor: pointer; }    /* click me */
```

- **A click word previews on hover.** Pointing at it lights up what the click will act on, so nothing feels dead under the pointer.
- **Make click words buttons,** so the keyboard reaches them.
- **Say it once, near the words:** "Point at a part to see where it lives; click to go there." A [`sb-callout`](../components/sb-callout/manifest.md) tip works when a whole chapter uses both.

## Good practice

- **Choose refs for what readers discuss,** not for every symbol. A handful of well-chosen refs beats dozens.
- **Use the same ref everywhere the thing appears:** the prose, the equation, the diagram, the table.
- **Match colours as well.** If î is green on the plane, make its column, its term and its pill green too. Lighting up then confirms what colour already suggested.
- **Keep it reversible.** Pointing at the arrow should light the equation, just as pointing at the equation lights the arrow.

## Going further

Highlighting lights up what's in view. To find a ref that's out of view, in a closed tab or a folded branch, and go to it, see the [locating practice](locating.md).
