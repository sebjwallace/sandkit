# sb-modal

A window over the page that holds attention until it is closed. Use it for one thing at a time that deserves the whole of a viewer's attention: an explanation of what just happened, a decision before a scenario starts, a closer look at something clicked. The page stays where it was underneath, so closing it returns the viewer to their place.

The modal knows nothing about the domain. The sandbox decides what goes in it and when it opens; the modal shows it over the page, keeps focus inside, and reports how the viewer closed it.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-modal/sb-modal.js"></script>

<sb-modal id="stockout" heading="Why did the shelf run empty?">
  <p>Demand rose faster than the warehouse could reorder.</p>
  <button slot="actions" data-close>Carry on</button>
  <button slot="actions" data-close="replay">Replay the week</button>
</sb-modal>

<script>
  const modal = document.getElementById('stockout');
  model.on('stockout', () => modal.show());
  modal.addEventListener('sb-close', (e) => {
    if (e.detail.reason === 'replay') replayWeek();
  });
</script>
```

## Content

| Child | Where it goes |
|---|---|
| Anything | The body, which scrolls when it is taller than the window. |
| `slot="actions"` | A footer below the body, aligned to the right. Plain buttons there get a simple look; the sandbox's own button styles win. |

Any element inside marked `data-close` closes the modal when clicked, giving its value as the reason (`data-close="replay"`), or `close` when it has none.

The content is moved inside the modal when it is built. To change it later, change what is inside the elements you gave it, rather than adding new children to `sb-modal`.

## Attributes

| Attribute | Meaning |
|---|---|
| `heading` | The title at the top, which also names the modal for screen readers. Without one, only the close button is shown. |
| `open` | Present while the modal is showing. |

## Properties and methods

| Member | Meaning |
|---|---|
| `open` | Get or set whether the modal is showing. Setting it fires no event. |
| `show()` | Open it. |
| `close()` | Close it. Fires no event. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-close` | `{ reason }` | The viewer closes the modal. `reason` is `close` (the × button, or a `data-close` with no value), `escape`, `backdrop`, or a `data-close` value. Fired after it has closed. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-font`, `--sb-radius`.

Its own token: `--sb-modal-width` (default `560px`); it never grows wider than the window.

Classes: `sb-modal__dialog` (a native `<dialog>`; its `::backdrop` dims the page), `sb-modal__header`, `sb-modal__title`, `sb-modal__close`, `sb-modal__body`, `sb-modal__actions`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-log`](../sb-log/manifest.md) or [`sb-table`](../sb-table/manifest.md) selections.** Open a modal on `sb-select` to look closely at one entry or row, without crowding the page.
- **[`sb-controls`](../sb-controls/manifest.md) or [`sb-timeline`](../sb-timeline/manifest.md).** Pause when the model reaches a moment worth explaining (set `running = false`, or call the timeline's `pause()`), show the modal, and carry on in answer to `sb-close`.
- **Any component inside it,** such as an [`sb-chart`](../sb-chart/manifest.md) of the moment being explained. A component that measures its size gets it when the modal opens, so set its data after `show()` if it draws only once.

## Notes

- **Use them sparingly.** A modal interrupts. Keep it for what should stop the viewer; anything they might want beside the model belongs in the page, or in a panel.
- **One at a time.** Opening a modal from inside another isn't supported.
- **Built on the browser's own modal dialog,** which lies over everything, keeps keyboard focus inside, closes on Escape, and returns focus to where it was when it closes.
- **A click on the backdrop closes it** only when the press began there too, so selecting text and letting go outside leaves it open.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** a modal dialog, named by its heading; the close button is labelled "Close".
- **Renaming:** if another component on the page is already called `sb-modal`, the console says so. Replace every `sb-modal` in `sb-modal.js` (tag, classes and style id all use it) to give this copy a new name.
