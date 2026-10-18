# sb-id

A short identifying code, shown as a pill. Hovering or focusing it shows what the code refers to; clicking it highlights every mention of that code on the page.

Supports the [identifiers practice](../../practices/identifiers.md). Read that first: it covers how to choose, issue and cite codes.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-id/sb-id.js"></script>

<p>Stores reorder when stock runs low (<sb-id code="RUL-001"></sb-id>).</p>

<script>
  document.addEventListener('sb-resolve', (e) => {
    const rule = model.rules.find((r) => r.id === e.detail.code);
    if (rule) e.detail.definition = { kind: 'Rule', title: rule.title, description: rule.description };
  });
</script>
```

## Resolving definitions

The pill keeps no list of definitions. It asks the sandbox by firing `sb-resolve`, which bubbles from the pill. The sandbox answers by setting `e.detail.definition`. One listener on `document` can answer for every pill.

A pill asks once the page has loaded (so the listener can be added anywhere), again on hover or focus, and whenever `refresh()` is called. If nothing answers, it asks once more on the next frame, then is marked unresolved.

**Define codes before showing them.** When a sandbox creates codes while it runs (for example, rules a person writes), register the definition before adding the pill, or call the pill's `refresh()` afterwards.

| Definition field | Meaning |
|---|---|
| `title` | What the code refers to, in a few words. |
| `description` | A sentence or two of explanation. |
| `kind` | The type of thing, such as Rule or Store. Shown as a small label. |

## Attributes and properties

| Member | Meaning |
|---|---|
| `code` | The code to show. Attribute or property; changing it re-resolves. |
| `definition` | Read-only. The definition the sandbox supplied, or `null`. |
| `refresh()` | Ask the sandbox again, for example after the model has changed. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-resolve` | `{ code, definition }` | The pill needs its definition. Set `definition` to answer. Bubbles. |
| `sb-select` | `{ code, highlighted }` | The pill was clicked, turning the highlight on or off. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-text`, `--sb-radius`, `--sb-font`.

Classes: `sb-id__pill`, `sb-id__card`, `sb-id__kind`, `sb-id__title`, `sb-id__description`. The element carries `sb-id--unresolved` and `sb-id--highlighted` when they apply. The element carries `data-ref` with its code, so a sandbox can find every mention: see the [locating practice](../../practices/locating.md).

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-parameters`](../sb-parameters/manifest.md), to cite where a parameter's default comes from.** Give the pill a `slot` matching the parameter's key, inside the panel: `<sb-parameters><sb-id slot="gravity" code="PAR-001"></sb-id></sb-parameters>`.
- **Prose and panels anywhere in the sandbox,** such as chapter text and detail panels, wherever a rule, entity, claim or source is mentioned.

## Notes

- **Highlighting is page-wide.** Clicking a pill highlights every `sb-id` with the same code, including ones added later. Clicking any of them again clears it.
- **The card is in the top layer** (the popover API), so scrolling containers never clip it.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** the pill is a button, described by its card. The card opens on keyboard focus as well as hover.
- **Renaming:** if another component on the page is already called `sb-id`, the console says so. Replace every `sb-id` in `sb-id.js` to give this copy a new name.
