# sb-trace-mode

Trace mode: click any part of a sandbox to see why it's there. While it's on, pointing outlines the parts that can be traced, and a click on one asks the sandbox to show its trace, instead of doing what the click normally does. Use it in any sandbox whose model cites its sources, so people can ask of any button, figure or rule: where did this come from?

It's a mode, part of the environment around a sandbox rather than a view of its subject: it lives in the shell's `modes` slot and follows the [modes practice](../../practices/modes.md). It doesn't draw the trace. The sandbox shows it however it likes, usually as a trace in a modal, as the [sources practice](../../practices/sources.md) describes.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-trace-mode/sb-trace-mode.js"></script>

<sb-shell>
  <sb-trace-mode slot="modes"></sb-trace-mode>
</sb-shell>

<script>
  const trace = document.querySelector('sb-trace-mode');
  const items = new Set(model.items.map((item) => item.id));
  trace.traceable = (ref) => items.has(ref);
  trace.addEventListener('sb-pick', (e) => openTrace(e.detail.ref));   // the sandbox shows the trace
</script>
```

## The flow

1. **Trace**, chosen in the shell's mode picker, starts it: the page dims a little inside an amber frame, and a banner at the bottom says "Tracing: click anything outlined to see why it's there", with **Stop**.
2. **Pointing** outlines the innermost part whose `data-ref` the sandbox says is traceable, walking out from what's under the pointer. The outline is drawn over the part, so nothing is added to it.
3. **A click** on an outlined part fires `sb-pick` with its ref. A click on anything else is stopped and does nothing, so nothing acts by accident. Clicks on what every mode lets through (`data-modes`, such as the mode picker) and inside open dialogs, such as the one showing the trace, act as usual.
4. **Stop**, Escape, or choosing another mode ends it. Escape leaves an open dialog to close first.

## Attributes

| Attribute | Meaning |
|---|---|
| `slot` | `modes`, to be offered in the shell's mode picker. |
| `heading` | The mode's name in the picker. Default `Trace`. |

## Properties

| Member | Meaning |
|---|---|
| `traceable` | `(ref) => boolean`: whether a ref can be traced, usually whether the model has an item with that id. Default: nothing can. |
| `heading` | The mode's name in the picker. |
| `active` | Whether trace mode is on, set by the shell's mode picker. Setting it fires no `sb-mode`. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-pick` | `{ ref }` | The viewer clicked a part that can be traced. Show its trace. Bubbles. |
| `sb-mode` | `{ mode, active: false }` | The viewer ended trace mode, with Stop or Escape. `mode` is the heading. Bubbles, so the shell's picker follows. |

## Styling

Theme tokens: `--sb-text`, `--sb-surface`, `--sb-font`, `--sb-radius`, and `--sb-warn`, the amber every mode wears so it never blends with the sandbox. Its own custom properties, to set on the element: `--sb-trace-mode-tone` (that colour) and `--sb-trace-mode-dim` (the dimming; default a faint translucent black).

Classes: `sb-trace-mode__dim`, `sb-trace-mode__banner`, `sb-trace-mode__button`, `sb-trace-mode__outline`.

## Notes

- **Never searches the page:** it looks only at `data-ref` on what's under the pointer and around it, the one thing components may look for (see the [locating practice](../../practices/locating.md)).
- **Top layer:** the dimming, banner and outline use the browser's popover API, above everything, floating panels included.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-trace-mode`, the console says so. Replace every `sb-trace-mode` in `sb-trace-mode.js` to give this copy a new name.
