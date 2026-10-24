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
- **A trace can come with it.** `refs` beside `ref` lists everything the thing is connected to, itself included, such as a train, the rules that decided it and what the board shows for it: `{ ref: 'T3', refs: ['T3', 'E3', 'T3.board.expected'] }`. Light everything in `refs` when it's there, and `ref` alone when it isn't. The model works the trace out, once, so every view lights the same things.

No component knows about any other. Each just announces, or listens, or both.

## Who takes part

| Part | Announces | Lights up |
|---|---|---|
| [`sb-id`](../components/sb-id/manifest.md) | its code, while hovered or focused | itself, when its code is announced |
| [`sb-math`](../components/sb-math/manifest.md) | the `data-ref` of the part hovered or focused | every part marked with the announced ref |
| [`sb-xref`](../components/sb-xref/manifest.md) | the ref of the place or link hovered or focused | — |
| [`sb-outliner`](../components/sb-outliner/manifest.md) | the ref of the entry pointed at, with its trace in `refs` | its entries: the ref strongly, the rest of `refs` faintly. Also keeps traces lit: see "Keeping things lit" |
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
// with its trace, and lights every part in the announced trace. Components inside root point and
// light up themselves. traceOf is the model's; without one, a part lights only its own ref.
function pointable(root, traceOf = (ref) => [ref]) {
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
    if (part && part !== partAt(e.relatedTarget)) announce(part.dataset.ref, traceOf(part.dataset.ref));
  };
  const leave = (e) => { if (partAt(e.target) && !partAt(e.relatedTarget)) announce(null); };
  root.addEventListener('pointerover', arrive);
  root.addEventListener('focusin', arrive);
  root.addEventListener('pointerout', leave);
  root.addEventListener('focusout', leave);

  document.addEventListener('sb-highlight', (e) => {
    const lit = new Set(e.detail.refs ?? [e.detail.ref]);
    for (const part of root.querySelectorAll('[data-ref]')) {
      if (partAt(part) === part) part.classList.toggle('is-lit', lit.has(part.dataset.ref));
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

When a part is used in more than one chapter or page, make it one of the sandbox's own components (see the [domain components practice](domain-components.md)), with `data-ref`, `highlight` and `reveal` like Sandkit's.

## Keeping things lit

Pointing lights things only while the pointer stays, and the light goes the moment someone moves to change something. Once a page is for doing, not only looking, people need highlights that last. [`sb-outliner`](../components/sb-outliner/manifest.md) lists what can be pointed at, and pins each thing as a **fill** or an **outline**, so two can be kept and compared. It sends every pinned trace in one page-wide event, `sb-pins`, from itself, bubbling to `document`, whenever pins, the outline or the model change:

```js
{ fill: ['T3', 'E3', 'T3.board.expected'], outline: ['T5'], glow: false }
```

- **Keep `is-pinned-fill` and `is-pinned-outline`** on every part whose ref is in each list, until the next `sb-pins`. They're the sandbox's own classes, like `is-lit`.
- **When the model changes, set the outliner's `items` again,** or call its `refresh()`: it works the traces out afresh, so a pinned case's lit rules follow whichever rules decide it now.
- **Components with a `highlight` property** take pins the way they take pointing: the sandbox routes them.
- **Glow.** With `glow` on, pinned highlights fade slowly down to 5% and back, so they catch the eye while people work elsewhere. The outliner animates one number, `--sb-glow`, on anything carrying the class `sb-outliner__glowing`, and everything inside inherits it. Put that class on the container while `glow` is true, and mix pinned colours with the number; pointing's `is-lit` stays at full strength.

Add this beside `pointable`, for each container:

```js
// Keeps the sandbox's own parts in root filled or outlined while the outliner's pins trace to them, glowing with them.
function pinnable(root, outliner) {
  outliner.addEventListener('sb-pins', (e) => {
    const fill = new Set(e.detail.fill), outline = new Set(e.detail.outline);
    root.classList.toggle('sb-outliner__glowing', e.detail.glow);
    for (const part of root.querySelectorAll('[data-ref]')) {
      part.classList.toggle('is-pinned-fill', fill.has(part.dataset.ref));
      part.classList.toggle('is-pinned-outline', outline.has(part.dataset.ref));
    }
  });
}
```

```css
.is-pinned-fill { background: color-mix(in srgb, var(--sb-accent) calc(var(--sb-glow, 1) * 28%), transparent); }
.is-pinned-outline { outline: 2px solid color-mix(in srgb, var(--sb-accent) calc(var(--sb-glow, 1) * 100%), transparent); }
```

A part redrawn after `sb-pins` has lost its classes: keep the last lists and mark again after drawing, or draw before setting `items`, as the outliner then sends them afresh.

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
