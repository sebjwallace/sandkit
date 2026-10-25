# sb-outliner

A floating panel outlining the things on a page that can be pointed at, each opening into its parts. Pointing at an entry lights everything it's connected to, wherever it is on the page. Two pins per entry, a fill and an outline, keep those traces lit while people work, follow the model as it changes, and can glow. Use it on any page where people reason about cause and effect across several views: what does this input affect, why does that output say what it says, and how do two cases compare.

It lights nothing on the page itself. Pointing announces the trace through `sb-highlight`, pins are sent as `sb-pins`, and the sandbox lights its own parts, as the [highlighting practice](../../practices/highlighting.md) describes.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-outliner/sb-outliner.js"></script>

<sb-shell>
  <sb-outliner slot="panels" id="highlights"></sb-outliner>
</sb-shell>

<script>
  const outliner = document.querySelector('sb-outliner');
  outliner.trace = (ref) => model.traceOf(ref);   // what a ref lights, as refs, itself included

  // Set the outline again whenever the model changes: pins follow.
  function render() {
    drawPage();
    outliner.items = [
      { heading: 'Trains' },
      { ref: 'T3', label: '10:42 Brighton', parts: [
        { heading: 'Inputs' },
        { ref: 'T3.delay', label: 'delay: 4' },
        { heading: 'On the board' },
        { ref: 'T3.board.expected', label: 'Expected: Exp 10:46' },
      ] },
    ];
  }

  pointable(page, outliner.trace);   // the page's parts announce their traces and light up
  pinnable(page, outliner);          // and stay lit while pinned
</script>
```

`pointable` and `pinnable` are the page helpers in the highlighting practice.

## The outline

| Entry | Meaning |
|---|---|
| `{ ref, label, parts }` | An item, such as a train or a rule. `label` is shown as text (the `ref` when there's none); `parts`, the same shape, open beneath it from a caret. One level of parts. |
| `{ heading }` | A heading between groups of items, or of parts ("Inputs", "On the board"). |

Parts are refs too, usually written as paths: `T3.delay` (an input of train T3), `T3.board.expected` (what the board shows for it), `E3.when.delay` (a condition of rule E3). Each can be pointed at and pinned like an item. Every entry carries `data-ref` with its ref.

## Attributes and properties

| Member | Meaning |
|---|---|
| `slot` | `panels`, for a button in the shell's header that opens and closes it. |
| `id` | Lets it remember, per viewer, the pins, the open items, glow, and whether it's open. Without one, nothing is remembered. Works when the browser refuses storage. |
| `heading` | The name in its bar and on its header button. Default `Highlights`. |
| `items` | The outline, as above. Setting it redraws, keeps pins and open items, drops pins on refs no longer listed, and sends `sb-pins`. |
| `trace` | `(ref) => [refs]`: what pointing at or pinning a ref lights, itself included. Default: the ref alone. The model's job: work it out once, and every view lights the same things. |
| `pins` | `{ fill: [refs], outline: [refs] }`, the refs pinned. Setting it sends `sb-pins` and no `sb-pin`. |
| `glow` | Whether pinned highlights glow. Viewers switch it with Glow. Setting it sends `sb-pins`. |
| `open` | Whether the panel shows. Set by the shell's header button; setting it fires nothing. |
| `refresh()` | Works out every pinned trace again and sends `sb-pins`, after the model changes without the outline changing. |
| `reveal(ref, place)` | Opens the panel and the item holding `place`, or else the item holding a part with that ref. Quiet: no events, and not remembered as the viewer's choice. Returns `false` if it lists no such ref. See the [locating practice](../../practices/locating.md). |

## What viewers do

- **Point** at an entry: it announces `sb-highlight` with `{ ref, refs }`, `refs` being its trace, and `{ ref: null }` once the pointer leaves the entries. Going from entry to entry announces each, with nothing between.
- **Open** an item with its caret, into its parts.
- **Pin** an entry with ■ to keep its trace filled, and □ to keep it outlined; an entry can be filled, outlined, both or neither. **Unpin all** clears them.
- **Glow** makes everything pinned fade slowly down to 5% and back, so pins catch the eye while people work elsewhere; off for people who ask for reduced motion.
- **Drag** the panel by its bar; it stays within the window. **✕** closes it, and its header button opens it again.

## What the panel shows

| Mark | When |
|---|---|
| A strong border, with a bar at its left | The entry's ref is the one announced, by the outliner or anything else on the page. |
| A faint border | The entry's ref is in the announced trace. |
| A filled background | A fill pin's trace reaches it. |
| A full border | An outline pin's trace reaches it. |

A closed item takes the marks of any of its parts, so folding a train away never hides that it's lit.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-pins` | `{ fill: [refs], outline: [refs], glow }` | Pins, glow, the outline or the traces changed: every pinned trace, worked out afresh. Fired from the outliner, bubbling to `document`. Keep `is-pinned-fill` and `is-pinned-outline` on the parts whose refs are listed until the next one. |
| `sb-pin` | `{ ref, kind, pinned }` | A viewer pinned or unpinned an entry, `kind` being `fill` or `outline`. Unpin all fires one for each. Bubbles. |
| `sb-open` | `{ panel, open: false }` | A viewer closed the panel with ✕. `panel` is its heading. Bubbles, so the shell's header button follows. |

It also announces `sb-highlight` and listens for it, as above.

## Glow

With `glow` on, the outliner animates one number, `--sb-glow`, from 1 down to 0.05 and back every 3 seconds, on itself and on anything carrying the class `sb-outliner__glowing`. Everything inside inherits the number, so one animation covers every view. The sandbox puts the class on its containers while `sb-pins` says `glow: true`, and mixes its pinned colours with the number:

```css
.is-pinned-fill { background: color-mix(in srgb, var(--sb-accent) calc(var(--sb-glow, 1) * 28%), transparent); }
.is-pinned-outline { outline: 2px solid color-mix(in srgb, var(--sb-accent) calc(var(--sb-glow, 1) * 100%), transparent); }
```

Pointing's `is-lit` doesn't use the number, so what's pointed at always shows at full strength.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-font`, `--sb-radius`.

The panel floats at the top right, below the header, 290px wide; position it, or give it a `max-height`, in the sandbox's CSS (`#highlights { top: auto; bottom: 16px; }`). Dragging sets its `left` and `top`.

Classes: `sb-outliner__bar`, `sb-outliner__grip`, `sb-outliner__title`, `sb-outliner__button`, `sb-outliner__body`, `sb-outliner__hint`, `sb-outliner__list`, `sb-outliner__heading`, `sb-outliner__entry`, `sb-outliner__parts`, `sb-outliner__caret`, `sb-outliner__label`, `sb-outliner__pin` (`--fill`, `--outline`), `sb-outliner__empty`. Entries carry `sb-outliner__entry--pointed`, `--lit`, `--pinned-fill` and `--pinned-outline` when they apply. `sb-outliner__glowing` carries the glow, as above.

## Notes

- **Readable outlines:** list the things people reason about, with values in their labels ("Demand: 30 MW"), not every element on the page. Split a big page's outline by heading.
- **Trace both ways:** an input should light what it feeds; an output what decided it.
- **Never searches the page:** it lights only its own entries, and leaves the page to the sandbox.
- **Components that light on `sb-highlight`** still light only for `ref`, not for the whole of `refs`.
- **Not yet:** nesting deeper than one level, building the outline from the page's `data-ref`s, more than two kinds of pin, remembering where the panel was dragged.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-outliner`, the console says so. Replace every `sb-outliner` in `sb-outliner.js` to give this copy a new name.
