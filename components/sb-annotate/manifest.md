# sb-annotate

Text with the parts that matter marked, each carrying a note. Use it wherever a sandbox has text worth reading closely: a transcript, an interview, a contract, a policy, a log of what someone said, a passage of a source. Pointing at a mark shows its note in a small card just above it; clicking pins the card open.

Write the text as ordinary HTML inside the element and wrap the parts that matter in `<mark>`. The sandbox owns the markup, so it can rewrite the text or its marks whenever the model changes.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-annotate/sb-annotate.js"></script>

<sb-annotate>
  <p>Customer: I've called
    <mark data-kind="risk" data-ref="contacts" data-note="Third contact in ten days: past the escalation threshold.">three times</mark>
    and nobody's got back to me.</p>
  <p>Agent: <mark data-kind="good" data-note="Takes ownership instead of passing it on.">I'll take this on myself</mark>.</p>
</sb-annotate>

<script>
  const transcript = document.querySelector('sb-annotate');
  transcript.kinds = {
    risk: { label: 'Risk', tone: 'bad' },
    good: { label: 'Good practice', tone: 'good' }
  };
  transcript.addEventListener('sb-select', (e) => console.log('Pinned', e.detail.ref));
</script>
```

## Markup

| Mark | On | Meaning |
|---|---|---|
| `<mark>` | any text inside | A part that matters. Every `<mark>` inside is an annotation. |
| `data-note` | a mark | The note, shown as plain text in the card. Without one, the mark shows no card but can still be pointed at and clicked. |
| `data-kind` | a mark | Its kind, named in `kinds`. Gives the mark its colour and the card its label. |
| `data-ref` | a mark | A name for it, to point at, highlight and hear about. Several marks may share a ref. |

## Properties

| Member | Meaning |
|---|---|
| `kinds` | `{ [kind]: { label, tone } }`. `tone` is `accent`, `good`, `warn`, `bad` or `muted`; the default is `accent`. Setting kinds shows a legend above the text, in the order given, counting each kind's marks. Marks with no kind, or one not listed, use the accent. |
| `highlight` | The refs to light up: `['contacts']`. Every mark with one is outlined. |
| `marks` | Read-only. The mark elements, in order. |

## Viewers

- **Pointing** at a mark (hover or focus) shows its note in a card just above the line pointed at, or below when there is no room. Other marks with its ref are outlined, and `sb-point` fires.
- **Clicking** a mark (or Enter or Space on it) pins its card open and fires `sb-select`. Clicking it again, clicking elsewhere, or Escape unpins it. Pointing at another mark meanwhile shows that one's note, then returns to the pinned one.
- **Pointing at a kind** in the legend fades every mark of another kind, so viewers see where that kind falls in the text.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-point` | `{ ref }`, `ref` `null` when pointing stops | A viewer points at a mark with another ref, or away. Bubbles. |
| `sb-select` | `{ ref, kind, note }`, each `null` if the mark lacks it | A viewer pins a mark. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-accent`, `--sb-accent-soft`, `--sb-radius`, `--sb-font`, and the tone tokens.

Classes: `sb-annotate__legend`, `sb-annotate__key` (`--highlighted`; carries `data-kind`), `sb-annotate__swatch`, `sb-annotate__count`, `sb-annotate__card`, `sb-annotate__kind`, `sb-annotate__note`. Marks carry their tone as a class (`sb-annotate--bad`), which sets `--sb-annotate-tone`, and `sb-annotate--pointed`, `--highlighted`, `--pinned` and `--faded` when they apply.

## Notes

- **Use marks sparingly.** Text marked everywhere has nothing standing out; mark what a reader would otherwise miss.
- **Not yet:** stepping through the marks in order, viewers adding their own notes by selecting text, a list of every note in the margin, and overlapping marks wait until a sandbox needs them.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** marks are focusable and described by the card, which is announced as a tooltip.
- **Renaming:** if another component on the page is already called `sb-annotate`, the console says so. Replace every `sb-annotate` in `sb-annotate.js` to give this copy a new name.
