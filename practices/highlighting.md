# Highlighting

How people point at one thing and see it light up everywhere it appears: in the prose, an equation, a diagram, a table. Hover "the first column" in a sentence, and the matrix's first column, the equation's term and the arrow it becomes all light up together, so the connection is seen rather than held in the head.

**You rarely need more than this page.** With one line, pointing, lighting by tag and chosen tags all work with no wiring, for anything with `data-ref` or `data-tags`. Then read only what you need:

| You're about to… | Read |
|---|---|
| Name parts the sandbox draws itself: SVG, prose, its own cards | [Your own parts](highlighting-own-parts.md) |
| Light something the script can't name, or announce from code | [Wiring](highlighting-wiring.md) |
| Light what's related by tag, or keep topics lit | [Tags](highlighting-tags.md) |
| Keep things lit while people work, with an outliner's pins | [Pins](highlighting-pins.md) |

## One line

Every page from the template has it. Name things with `data-ref`, which most components already do:

```html
<script src="lib/sandkit/shell/sb-highlighting.js"></script>
```

- **Pointing at anything with a `data-ref`,** or focusing it with the keyboard, lights everything with that ref, inside components too, through redraws. The innermost part wins.
- **It takes the theme's accent:** a see-through tint and ring on HTML, a stroke on SVG, never a fill.
- **A tap lights nothing,** since a tap acts. Modes carry on: pointing means what it always did, and clicks are the mode's.
- **Tagged parts light what's related,** faintly, and chosen tags stay lit (see [Tags](highlighting-tags.md)).

**Name the thing, not what holds it.** A `data-ref` on a whole panel lights the whole panel whenever the pointer is anywhere inside it.

## Pointing at several things on purpose

Words or a button can light several things a sentence means together:

```html
<span class="point" data-points-at="TRK-1 SIG-1 RUL-1" tabindex="0">the parts that stop a train</span>
```

The words themselves aren't lit, and aren't found as a place. Everything named lights alike, so choose them for what the sentence says. Give it `tabindex="0"`, or make it a button, so the keyboard reaches it. It can preview a click: `<button data-go="CMP-3" data-points-at="CMP-3">`.

## Pointing shows, clicking acts

Keep the two apart everywhere in a sandbox. Pointing (hover or focus) only lights things, and clears when the pointer leaves. Clicking does something lasting: selects, navigates, steps the model. Show which words are which:

```css
.point { border-bottom: 1px dashed var(--sb-accent); cursor: default; }   /* point at me */
.act   { border-bottom: 1px solid var(--sb-accent); cursor: pointer; }    /* click me */
```

A click word previews on hover, lighting what the click will act on, and is a button so the keyboard reaches it. Say it once, near the words: "Point at a part to see where it lives; click to go there."

## Good practice

- **Choose refs for what readers discuss,** not for every symbol. A handful of well-chosen refs beats dozens.
- **Use the same ref everywhere the thing appears,** using its code where it has one (see the [identifiers practice](identifiers.md)).
- **Match colours as well.** If î is green on the plane, make its column, term and pill green too.
- **Keep it reversible.** Pointing at the arrow lights the equation, just as pointing at the equation lights the arrow.

To find a ref that's out of view, in a closed tab or a folded branch, and go to it, see the [locating practice](locating.md).
