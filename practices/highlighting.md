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

To make the sandbox's own elements point too, announce from them in the same way:

```js
element.addEventListener('pointerenter', () => announce('i-hat'));
element.addEventListener('pointerleave', () => announce(null));
```

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
