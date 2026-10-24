# sb-stamp

A status pressed onto the page like a rubber stamp: approved, received, verified, superseded. Use it wherever a thing's standing changes and should stand apart from the thing itself: claims the model's tests verify, decisions signed off, sources received or superseded, codes retired, assumptions not yet tested. Ink on a card reads as an act, by someone, at a time, where words or coloured pills look like everything else.

The stamp never decides anything. The sandbox sets what it says from the model, and marks it stale when the model has moved past it.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-stamp/sb-stamp.js"></script>

<sb-stamp label="Signed off" tone="good" shape="seal" when="18 Sep 2026">
  <span slot="detail">against model 0.3</span>
  <sb-person slot="who" ref="ana" name="Ana Ruiz" role="Control room lead"></sb-person>
</sb-stamp>
```

Set stamps from the model, never by hand, so none can stay saying something that's no longer true. One loop after every change of the model does it:

```js
for (const claim of model.claims) {
  const stamp = document.querySelector(`sb-stamp[data-ref="${claim.id}"]`);
  const passes = claim.test(model);
  stamp.label = passes ? 'Verified' : 'Failing';
  stamp.tone = passes ? 'good' : 'bad';
  stamp.when = `model ${model.version}`;
}
signoff.stale = model.version === '0.3' ? null : `signed off at 0.3, model now ${model.version}`;
```

## Attributes and properties

Each attribute has a property of the same name. Only `label` is needed.

| Member | Default | Meaning |
|---|---|---|
| `label` | | What the stamp says: "Approved", "Received", "Verified". Kept short, one or two words. |
| `tone` | `neutral` | The ink: `good`, `warn`, `bad` or `neutral`. The label carries the meaning without colour. |
| `shape` | `rect` | `rect`, a round `seal`, or `date`, which sets `when` in a ruled band across the middle. |
| `icon` | the tone's | `check`, `cross`, `alert`, `clock`, `question` or `none`. Without it, `good` shows a tick, `bad` a cross, `warn` a warning sign and `neutral` nothing. Choose another where the tone's own misleads, such as `clock` for Superseded or `question` for Assumption. |
| `when` | | When it was stamped, already formatted: a date, a time and time zone, or a version ("model 0.5"). Optional. |
| `stale` | | Set when the stamp no longer holds, with the reason: "approved at 0.3, model now 0.5". The ink fades, the label is struck through, and "Stale: …" shows below in plain words. An empty value says only "Stale". `null` (or removing the attribute) clears it. Works with any label and tone. |

All text is shown as text, never as markup.

## Slots

| Slot | Meaning |
|---|---|
| `detail` | A line of detail: "against SRC-3", "in workshop 2", "by REC-31". Can hold codes. |
| `who` | Who or what stamped it. Several people can share the slot. |

Both are optional and shown inside the stamp. Content slotted after the stamp is on the page is moved into place as it arrives.

## Events

None: a stamp does nothing when clicked. Give it a `data-ref` to take part in pointing and finding, as the sandbox's own parts do (see the [highlighting practice](../../practices/highlighting.md)).

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-font`.

The ink colour is `--sb-stamp-ink`, set by tone; a sandbox can set it on a stamp for an ink of its own.

Classes: `sb-stamp__ink` (the stamp itself, with its rules), `sb-stamp__label`, `sb-stamp__icon`, `sb-stamp__when`, `sb-stamp__detail`, `sb-stamp__who`, `sb-stamp__stale` (the reason below). The element carries `sb-stamp--stale` when stale.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-person`](../sb-person/manifest.md)** in the `who` slot, so a person looks the same on a stamp as everywhere else.
- **[`sb-id`](../sb-id/manifest.md)** in the `detail` slot, for the source, decision or record the stamp points to.
- **[`sb-choice`](../sb-choice/manifest.md)** and **[`sb-source`](../sb-source/manifest.md)** cards, with a stamp placed on them by the sandbox: Agreed on a decision, Received or Superseded on a source.
- **The model's tests,** run on load and after every change, setting each claim's stamp to Verified or Failing, so verification can never go stale unnoticed.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** the stamp's text reads in order: label, when, detail, who, then any stale reason. Icons are hidden from screen readers, as the label says the same.
- **Renaming:** if another component on the page is already called `sb-stamp`, the console says so. Replace every `sb-stamp` in `sb-stamp.js` (tag, classes, style id and the ink token all use it) to give this copy a new name.
