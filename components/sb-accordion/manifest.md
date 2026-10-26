# sb-accordion

Sections that open and close: one on its own, or a group. Use it for a system in parts (each part's headline on its heading, its detail inside), for questions with their answers folded below, for the working behind a figure, or for detail most readers can skip.

A closed section is never silent. Its heading carries a short note the sandbox keeps up to date, a dot when what's inside has changed since the viewer last saw it, and a tint when something highlighted elsewhere is inside it. So folding a part away never hides that it matters.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-accordion/sb-accordion.js"></script>

<sb-accordion>
  <details data-ref="filtration" note="4 of 4 fine">
    <summary>Filtration</summary>
    …readings, with the parts that matter marked data-ref="filter-3"…
  </details>
  <details data-ref="storage" note="Tank 72%"><summary>Storage</summary>…</details>
</sb-accordion>

<script>
  // Keep each headline live from the model.
  storage.setAttribute('note', `Tank ${model.tank}%`);
</script>
```

## Sections

Every `<details>` child is a section, headed by its `<summary>`; other children are left as they are. Sections are plain HTML, so the page reads properly before the script loads. Sections added or removed later are picked up. Add `open` to a section to start it open.

| Section attribute | Meaning |
|---|---|
| `note` | A short headline shown at the right of the heading, such as "Tank 72%" or "2 alerts". Shown as text. Change it as the model changes. |
| `data-ref` | What the section is about. Pointing at its heading announces it, and it lights up when the ref is announced. |

## Attributes and properties

| Member | Meaning |
|---|---|
| `single` | One section open at a time: opening one closes the rest. Also a property. |
| `sections` | The sections, in order. |
| `expandAll()`, `collapseAll()` | Open or close every section, as the buttons do. Fire `sb-toggle` for each section that changes. |
| `reveal(ref, place)` | Open the section holding `place`, an element on the page, or without one the first section holding a part marked `data-ref="ref"` (or marked so itself). Quiet: no `sb-toggle`. Returns `true`, or `false` if no section holds it. |

With two or more sections, and without `single`, the accordion shows **Expand all** and **Collapse all**, each greyed out when there's nothing for it to do. One section on its own has no buttons.

## What a closed section shows

| Mark | When |
|---|---|
| The note | Always, from the section's `note`. |
| A dot | The section's content has changed while closed, compared with when the viewer last saw it open (or when the page loaded). Only the words count, not styling, and not the heading or note. Opening the section clears it. |
| A tint | The announced ref is the section's own, or is marked on a part inside it while it's closed. |

Changes start counting once the page has loaded, so components inside drawing themselves aren't news.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-toggle` | `{ index, ref, open }` | The viewer opens or closes a section, by its heading, the buttons, `expandAll()` or `collapseAll()`. `open` is the state it's now in; `ref` is the section's `data-ref`, or `null`. Bubbles, so a nested accordion's events pass through its parent: check `e.target`. |

## Highlighting

Follows the [highlighting practice](../../practices/highlighting.md):

| Announces | Lights up |
|---|---|
| a section's `data-ref`, while its heading is pointed at, and `null` on leaving | a section whose `data-ref` is announced; a closed section holding a part marked with it |

## Nesting

Put an accordion inside a section for a deeper layer. Each accordion looks only at its own sections and buttons, so they nest without knowing about each other. A sandbox's `goTo` (see the [locating practice](../../practices/locating.md)) calls `reveal` on every accordion around a place, outermost first, so each level opens on the way.

```html
<sb-accordion single>
  <details>
    <summary>Why are there two high tides a day?</summary>
    <p>…</p>
    <sb-accordion>
      <details><summary>Go deeper: why the far side bulges too</summary>…</details>
    </sb-accordion>
  </details>
</sb-accordion>
```

## Layering

The accordion draws on the surface. To set it apart from what it sits on, the sandbox applies the shell's lift and drop tokens in its own CSS:

```css
/* Each accordion stands off what it sits on, and the open section comes forward. */
.sb-accordion,
.sb-accordion > details[open] { background: linear-gradient(var(--sb-lift), var(--sb-lift)); box-shadow: var(--sb-lift-shadow); }

/* A nested accordion drops a step below its parent instead, open sections and all. */
.sb-accordion .sb-accordion { background: linear-gradient(var(--sb-drop), var(--sb-drop)); box-shadow: none; }
.sb-accordion .sb-accordion > details[open] { background: none; box-shadow: none; }
```

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-warn`, `--sb-radius`, `--sb-font`.

Classes: `sb-accordion__controls`, `sb-accordion__control`, `sb-accordion__note`, `sb-accordion__changed`. Each section carries `sb-accordion__section`, and `sb-accordion__section--changed`, `--highlighted` and `--lit-inside` when they apply.

## Notes

- **Keyboard:** each heading is reached with Tab and toggled with Enter or Space, as a `<details>` always is.
- **Opening a section by setting `open`** on it works, but bypasses `single`; use `reveal` to open one from the sandbox.
- **`data-ref` and the words in each section are all the accordion looks at** in its content: refs for `reveal` and the tint, words for the changed dot.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-accordion`, the console says so. Replace every `sb-accordion` in `sb-accordion.js` to give this copy a new name.
