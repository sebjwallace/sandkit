# Highlighting

How to let people point at one thing and see it light up everywhere it appears: in the prose, in an equation, in a diagram, in a table. Hover a reference to "the first column" in a sentence, and the first column of the matrix, the matching term of the equation and the arrow it becomes all light up together.

Read this before putting pointing in a sandbox, or using [`sb-math`](../components/sb-math/manifest.md) or the pointing behaviour of [`sb-id`](../components/sb-id/manifest.md).

## Why it matters

Explanations refer to things: this term, that arrow, the second rule. Readers have to hold the connection in their heads, matching words to symbols to pictures. Lighting up every appearance of the thing being pointed at makes the connection visible, and lets people check their understanding just by moving the pointer.

## Getting it with one line

Every page started from the template includes one script. Name things with `data-ref`, which most components already do:

```html
<script src="lib/sandkit/shell/sb-highlighting.js"></script>
```

That's all the wiring there is:

- **Pointing at anything with a `data-ref`,** in a component or the sandbox's own, or focusing it with the keyboard, announces it. The innermost part wins, and moving straight to another part has no `null` between.
- **Everything with that ref lights up,** including inside components, and stays lit through a redraw.
- **Pins in an [`sb-outliner`](../components/sb-outliner/manifest.md) keep things lit** everywhere too: see "Keeping things lit".
- **It takes the theme's accent,** a see-through tint and ring on HTML, and a stroke on SVG, never a fill, which could hide what's on the shape.
- **A tap lights nothing,** since a tap acts, and pointing never fires a viewer's click.
- **New pages have it already.** The page templates include the line. A page made before they did behaves as it always did until the line is added.
- **Modes carry on.** Pointing means what it always did while a mode is on, and clicks are the mode's.

Name the thing, not what holds it. A `data-ref` on a whole panel lights the whole panel whenever the pointer is anywhere inside it.

## Pointing at several things on purpose

Words or a button can light several things that the sentence means together. Name them with `data-points-at`:

```html
<span class="point" data-points-at="TRK-1 SIG-1 RUL-1" tabindex="0">the parts that stop a train</span>
```

- **The words aren't one of those things,** so they aren't lit, and `placesOf` doesn't find them.
- **Everything named lights alike.** Saying "these three" is what gives the lighting its meaning, so choose them for what the sentence says.
- **Give it `tabindex="0"`, or make it a button,** so the keyboard reaches it.
- **It can preview a click:** `<button data-go="CMP-3" data-points-at="CMP-3">` lights what the click will go to.

A list can also be sent from code, as the protocol above says, for a sandbox whose model works it out.

## The protocol

One page-wide event, `sb-highlight`, fired on `document`:

```js
document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref: 'i-hat' } }));  // pointing at î
document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref: null } }));     // pointing at nothing
```

- **A ref is a short name for a thing,** such as `i-hat`, `col-1` or `RUL-003`. Use the thing's code where it has one (see the [identifiers practice](identifiers.md)).
- **Announce a ref** when something starts being pointed at (hover or keyboard focus), and `null` when it stops.
- **Light up** whatever you've marked with the announced ref, and clear it on `null` or a different ref.
- **A list can come with it.** `refs` beside `ref` names everything to light, itself included, such as a train, the rules that decided it and what the board shows for it: `{ ref: 'T3', refs: ['T3', 'E3', 'T3.board.expected'] }`. Light everything in `refs` when it's there, and `ref` alone when it isn't.

No component knows about any other. Each just announces, or listens, or both.

## Who takes part

| Part | Announces | Lights up |
|---|---|---|
| The script | anything with a `data-ref`, or `data-points-at`, that nothing else speaks for | everything with an announced ref |
| [`sb-id`](../components/sb-id/manifest.md), [`sb-person`](../components/sb-person/manifest.md) | itself, while pointed at | itself |
| [`sb-poll`](../components/sb-poll/manifest.md) | an option with a `ref` | those options |
| [`sb-accordion`](../components/sb-accordion/manifest.md) | a section, while its heading is pointed at | those sections, and tints a closed one holding a named part |
| [`sb-math`](../components/sb-math/manifest.md) | the `data-ref` of the part hovered or focused | every part marked with the ref |
| [`sb-discovery-card`](../components/sb-discovery-card/manifest.md) | a passage's source, a card in a fold, or itself | through the script |
| [`sb-xref`](../components/sb-xref/manifest.md) | the ref of the place or link hovered or focused | — |
| [`sb-outliner`](../components/sb-outliner/manifest.md) | the ref of the entry pointed at, with its trace in `refs` | its entries: the ref strongly, the rest of `refs` faintly |

**A component says when it speaks for itself,** with two attributes that the script reads, so it never needs a component's name:

- `data-sb-announces` on an element: nothing inside it is announced by the script.
- `data-sb-lights` on a part: the part lights itself, so the script neither lights nor announces it. Parts inside it still count. It doesn't show pins either, until a component takes them itself.

## Wiring what the script can't

The script lights parts by name. Reach for wiring only for what that leaves out:

- **Things with no `data-ref`,** such as a column of [`sb-matrix`](../components/sb-matrix/manifest.md) or an arrow on [`sb-plane`](../components/sb-plane/manifest.md).
- **What only a component's own `highlight` can do,** such as `sb-tree` marking the closed branch that holds a node, or `sb-c4` lighting a line that carries several relationships.
- **Meaning the model knows,** such as a line lighting the messages travelling along it, or a part lighting everything connected to it whenever it's pointed at.

A listener routes refs to those components' `highlight` properties, which each take their own shape, and sits happily beside the script:

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

To announce for something the script can't name, do it from a listener of your own. The script hears that and stays out of the way, for that pointing, whatever you chose to announce:

```js
const announce = (ref, refs) => document.dispatchEvent(new CustomEvent('sb-highlight', { detail: refs ? { ref, refs } : { ref } }));

matrix.addEventListener('pointerover', (e) => announce(columnRefAt(e.target) ?? null));
matrix.addEventListener('pointerleave', () => announce(null));
```

Do the same, with a list, for a part that should always light what the model connects it to: `announce(ref, model.traceOf(ref))`.

### Sandboxes wired before the script

`pointable`, `pinnable`, `is-lit`, routing tables and the two announcing lines all keep working with the script on the page, and nothing fires twice. When you next touch such a page, you can delete `pointable`, `pinnable`, their `is-lit` and `is-pinned` CSS, and any announcing that only repeats a part's `data-ref`, along with any routing that only lights parts by that ref.

While a part is lit by the script, it shows the script's look, even when a routed `highlight` would have coloured it differently.

## Your own parts

Components can't cover everything. A diagram drawn in SVG, a phrase in the prose, a card the sandbox lays out itself: these point, light up and are found like everything else, once they're named.

### Name what a part is

Give every part that stands for a thing in the model `data-ref` with that thing's id, as components do. That one attribute lets `placesOf` find it, `refsAt` cite it in comments, and tours and cross-references go to it (see the [locating practice](locating.md)).

- **On the part's outermost element:** the `<g>` in SVG, the `<span>` around a phrase, the card's root.
- **Never inside a component.** Add nothing to what a component draws: it redraws whenever it likes. Route to its `highlight` instead, as above.
- **A part that goes somewhere is a link,** as in the locating practice: keep its target in `data-go`, call `goTo` on click, and let `data-points-at` preview it. Make it a button, or in SVG give it `role="button"` and `tabindex="0"`, so the keyboard reaches it.

### Look like the components

The script lights your parts for you. Two things are yours:

- **Draw shapes so a stroke shows.** On SVG, the script strokes a part's own shapes, the direct children of its `<g>`, or the shape itself if that's what carries the `data-ref`. A shape filled in the accent shows it less, so leave room around it, or give it another colour.
- **Colour through classes, not attributes.** A class in `style.css` is easy to change; `fill="#c33"` is not.

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

- **The script keeps them lit** everywhere their refs appear, through redraws: a fill as a tint, and on SVG a thick stroke; an outline as an outline, and on SVG a dashed stroke. Pointing at something outranks its pin while it lasts.
- **When the model changes, set the outliner's `items` again,** or call its `refresh()`: it works the traces out afresh, so a pinned case's lit rules follow whichever rules decide it now.
- **Components with a `highlight` property that the script can't reach** take pins the way they take pointing: the sandbox routes them.
- **Glow.** With `glow` on, pinned highlights fade slowly down to 5% and back, so they catch the eye while people work elsewhere. The outliner animates one number, `--sb-glow`, on anything carrying the class `sb-outliner__glowing`, and everything inside inherits it. The script puts that class on the page while any outliner has `glow` on. Pointing stays at full strength.

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
