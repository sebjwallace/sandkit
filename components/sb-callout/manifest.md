# sb-callout

A block that stands out from the text around it, like a textbook's "Definition" box. Use it for definitions, notes, tips, questions, answers and warnings: anything a reader should notice, or be able to find again. Its content is whatever is inside it, from a sentence to lists, maths or other components. A callout can be collapsible, which suits answers: think first, then reveal.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-callout/sb-callout.js"></script>

<sb-callout kind="definition" heading="Span">
  <p>All the places you can reach by combining some vectors.</p>
</sb-callout>

<sb-callout kind="question"><p>Can two vectors span the whole plane?</p></sb-callout>
<sb-callout kind="answer" collapsible><p>Yes, unless they lie on the same line.</p></sb-callout>
```

## Kinds

| `kind` | Title | Tone |
|---|---|---|
| `definition` | Definition | accent |
| `note` (default) | Note | muted |
| `tip` | Tip | good |
| `question` | Question | accent |
| `answer` | Answer | good |
| `warning` | Warning | warn |

Each has its own icon. Any other kind looks like a note: give it a `heading`, and a `tone` if it needs a colour.

## Attributes

| Attribute | Meaning |
|---|---|
| `kind` | One of the kinds above. |
| `heading` | Replaces the kind's title, such as "Definition: span" or "Example". |
| `tone` | Replaces the kind's colour: `accent`, `good`, `warn`, `bad` or `muted`. |
| `collapsible` | Hides the content behind the title until it is opened. |

## Properties

| Property | Meaning |
|---|---|
| `kind` | Read-only. The kind in effect (`note` for anything unrecognised). |
| `open` | For a collapsible callout, whether its content is showing. Settable. Always `true` otherwise. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-radius`, and the tone tokens.

Classes: `sb-callout__title`, `sb-callout__body`, `sb-callout__details` (collapsible ones). The tone is a class, such as `sb-callout--warn`, and sets `--sb-callout-tone` for the stripe and title.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-id`](../sb-id/manifest.md) pills inside a definition,** so the term it defines can be pointed at from elsewhere.
- **[`sb-math`](../sb-math/manifest.md) or [`sb-matrix`](../sb-matrix/manifest.md)** inside a definition, for the notation that goes with it.

## Notes

- **Use them sparingly.** A page of callouts has no stand-out left; keep them for what readers must not miss.
- **Collapsible callouts use the browser's own disclosure element,** so they open with a click or the keyboard, and are announced properly.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** announced as a note, named by its title.
- **Renaming:** if another component on the page is already called `sb-callout`, the console says so. Replace every `sb-callout` in `sb-callout.js` to give this copy a new name.
