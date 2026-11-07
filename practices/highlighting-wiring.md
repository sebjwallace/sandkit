# Wiring

The script lights parts by name. Wire only what that leaves out. Part of the [highlighting practice](highlighting.md).

## The protocol

One page-wide event, `sb-highlight`, fired on `document`:

```js
document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref: 'i-hat' } }));  // pointing at î
document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref: null } }));     // pointing at nothing
```

- **Announce a ref** when something starts being pointed at (hover or keyboard focus), and `null` when it stops. Light whatever you've marked with it, and clear it on `null` or a different ref.
- **A list can come with it:** `{ ref: 'T3', refs: ['T3', 'E3', 'T3.board.expected'] }`. Light everything in `refs` when it's there, and `ref` alone when it isn't.
- **Tags can come with it:** `{ ref: 'SRC-3', tags: ['platforms', 'passengers'] }`. A part with tags and no ref announces `{ ref: null, tags: […] }`, which listeners following only refs read as pointing at nothing. A component announcing for itself includes the tags of the part it announces.

No component knows about any other. Each just announces, or listens, or both.

## Who takes part

| Part | Announces | Lights up |
|---|---|---|
| The script | anything with a `data-ref`, `data-points-at` or `data-tags` that nothing else speaks for | everything with an announced ref, and faintly everything sharing an announced tag |
| [`sb-id`](../components/sb-id/manifest.md), [`sb-person`](../components/sb-person/manifest.md) | itself, while pointed at | itself |
| [`sb-poll`](../components/sb-poll/manifest.md) | an option with a `ref` | those options |
| [`sb-accordion`](../components/sb-accordion/manifest.md) | a section, while its heading is pointed at | those sections, and tints a closed one holding a named part |
| [`sb-math`](../components/sb-math/manifest.md) | the `data-ref` of the part hovered or focused | every part marked with the ref |
| [`sb-discovery-card`](../components/sb-discovery-card/manifest.md) | a passage's source, a card in a fold, or itself | through the script |
| [`sb-xref`](../components/sb-xref/manifest.md) | the ref of the place or link hovered or focused | — |
| [`sb-outliner`](../components/sb-outliner/manifest.md) | the ref of the entry pointed at, with its trace in `refs` | its entries: the ref strongly, the rest of `refs` faintly |

A component says when it speaks for itself, with attributes the script reads, so it never needs a component's name:

- `data-sb-announces` on an element: nothing inside it is announced by the script.
- `data-sb-lights` on a part: the part lights itself, so the script neither lights nor announces it, nor shows pins on it. Parts inside it still count.
- `data-sb-shows-chosen` on an element: chosen tags inside it are shown by it, as a board does with its coloured dots. Pointing still lights as usual.

## Wiring what the script can't

- **Things with no `data-ref`,** such as a column of [`sb-matrix`](../components/sb-matrix/manifest.md) or an arrow on [`sb-plane`](../components/sb-plane/manifest.md).
- **What only a component's own `highlight` can do,** such as `sb-tree` marking the closed branch that holds a node.
- **Meaning the model knows,** such as a part lighting everything connected to it.

Route refs to those components' `highlight` properties, which each take their own shape, beside the script:

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

To announce for something the script can't name, do it from a listener of your own. The script hears that and stays out of the way:

```js
const announce = (ref, refs) => document.dispatchEvent(new CustomEvent('sb-highlight', { detail: refs ? { ref, refs } : { ref } }));

matrix.addEventListener('pointerover', (e) => announce(columnRefAt(e.target) ?? null));
matrix.addEventListener('pointerleave', () => announce(null));
```

For a part that should always light what the model connects it to: `announce(ref, model.traceOf(ref))`.

## Sandboxes wired before the script

`pointable`, `pinnable`, `is-lit`, routing tables and announcing lines all keep working with the script on the page, and nothing fires twice. When you next touch such a page, you can delete `pointable`, `pinnable`, their `is-lit` and `is-pinned` CSS, and any announcing or routing that only repeats a part's `data-ref`. While the script lights a part, it shows the script's look.
