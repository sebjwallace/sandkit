# sb-inspect-mode

Inspect mode: point at any part of a sandbox to be told exactly what it is. While it's on, pointing outlines the parts the sandbox can explain and, after a moment, shows the explanation in a card at the side: a definition, what the part is doing now, the data behind it, the rules it takes part in, whatever explains it best. A click holds the card on that part, instead of doing what the click normally does. Use it wherever a sandbox has labels people could misread: codes, questions in a decision tree, the parts of a machine, a column, a value.

It's a mode, part of the environment around a sandbox rather than a view of its subject: it lives in the shell's `modes` slot and follows the [modes practice](../../practices/modes.md). It answers *what is this?*; trace mode answers *how do we know?*, from the sources.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-inspect-mode/sb-inspect-mode.js"></script>

<sb-shell>
  <sb-inspect-mode slot="modes"></sb-inspect-mode>
</sb-shell>

<script>
  const inspect = document.querySelector('sb-inspect-mode');
  inspect.explain = (ref) => {
    const part = model.parts[ref];
    if (!part) return null;   // nothing to say: not outlined
    return { kind: 'Part · moving', title: part.name, body: `<p>${part.is}</p><p>Now: ${part.now(model)}</p>` };
  };
</script>
```

## The flow

1. **Inspect**, chosen in the shell's mode picker, starts it: the page dims a little inside an amber frame, and a banner at the bottom says "Inspecting: point at anything outlined to see what it is", with **Stop**.
2. **Pointing** at a part, after a short pause (120 ms, so crossing parts on the way doesn't flicker), outlines the innermost part around the pointer that `explain` has something to say about, and shows its explanation in the card. Pointing at anything else keeps what's shown, so the pointer can travel to the card.
3. **A click** on a part holds the card on it at once; pointing elsewhere then changes nothing. Clicking it again, or anywhere with nothing to explain, lets go. Clicking another part holds that one. Clicks never act on the page while inspecting. Clicks on what every mode lets through (`data-modes`, such as the mode picker), inside open dialogs and inside the card act as usual.
4. **The card** sits at the right, below the header, and is dragged by its bar to wherever it covers nothing that matters. It stays there, within the window, until the page reloads.
5. **Stop**, Escape, or choosing another mode ends it. Escape leaves an open dialog to close first.

## Attributes

| Attribute | Meaning |
|---|---|
| `slot` | `modes`, to be offered in the shell's mode picker. |
| `heading` | The mode's name in the picker. Default `Inspect`. |

## Properties and methods

| Member | Meaning |
|---|---|
| `explain` | `(ref, element) => entry or null`, called with a part's `data-ref` and the part. An entry is `{ kind, title, body }`, all optional: `kind` a short label shown in capitals in the card's bar ("Part · moving"), `title` text or an element, `body` an HTML string or an element, so components can go in. Text is never rendered as markup; `body` as a string is the sandbox's own HTML. `null` means nothing to say: the part isn't outlined, and the part around it is tried. Called each time a part is shown, so it explains the model as it is now. Default: nothing can be explained. |
| `heading` | The mode's name in the picker. |
| `active` | Whether inspect mode is on, set by the shell's mode picker. Setting it fires no `sb-mode`. |
| `current` | Read-only. The ref explained in the card, or `null`. |
| `show(ref, element)` | Explains a ref and holds it, as a click does, outlining `element` if given; explains it afresh if already shown. For a tour or the page to point something out while inspecting. Only while the mode is on; quiet: no `sb-inspect`. Returns `false` if the mode is off or `explain` returns `null`. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-inspect` | `{ ref }` | The viewer's pointing or click showed a part in the card. Bubbles. |
| `sb-mode` | `{ mode, active: false }` | The viewer ended inspect mode, with Stop or Escape. `mode` is the heading. Bubbles, so the shell's picker follows. |

## Writing explanations

The component knows nothing about any subject; what makes each thing unmistakable is the sandbox's judgement, kind by kind.

- **Lead with what it means,** in plain words, before any detail.
- **Say how it stands now,** from the model: the value, the reading, what a moving part is doing at this moment, whether a rule is in force and why. The same part reads differently as the model changes, which is the point.
- **Say what it touches:** what it feeds, what decides it, how many cases take it, which rules test it.
- **Choose per kind.** A definition suits a term, the data with the right lines picked out suits a field, a rule suits an outcome, an example suits a value. Sources only when they really are the clearest answer; tracing is trace mode's job.
- **Keep it short:** a few lines, readable without scrolling. Put the kind in `kind` ("Question · an input", "Part · fixed") so people learn the kinds of thing there are.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-font`, `--sb-radius`, and `--sb-warn`, the amber every mode wears so it never blends with the sandbox. Its own custom properties, to set on the element: `--sb-inspect-mode-tone` (that colour) and `--sb-inspect-mode-dim` (the dimming; default a faint translucent black).

Classes: `sb-inspect-mode__dim`, `sb-inspect-mode__banner`, `sb-inspect-mode__words`, `sb-inspect-mode__button`, `sb-inspect-mode__outline`, `sb-inspect-mode__card`, `sb-inspect-mode__bar`, `sb-inspect-mode__grip`, `sb-inspect-mode__kind`, `sb-inspect-mode__body`, `sb-inspect-mode__title`, `sb-inspect-mode__content`. The element carries `sb-inspect-mode--held` while a part is held. Style what bodies hold under `.sb-inspect-mode__content`.

## Notes

- **Never searches the page:** it looks only at `data-ref` on what's under the pointer and around it, the one thing components may look for (see the [locating practice](../../practices/locating.md)).
- **Adds nothing to the page:** the outline is drawn over the part in the top layer, so parts components draw stay untouched.
- **A part redrawn while shown** loses its outline, since it's a new element; the card stays. Move parts in place, rather than redrawing them, where they're often inspected.
- **Top layer:** the dimming, outline, card and banner use the browser's popover API, above everything, floating panels included.
- **Not yet:** touch (no pointing: a tap could show), remembering where each viewer put the card.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-inspect-mode`, the console says so. Replace every `sb-inspect-mode` in `sb-inspect-mode.js` to give this copy a new name.
