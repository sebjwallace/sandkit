# sb-tour

A guided tour of the page as it stands: a tooltip beside one thing at a time, saying what it is, with the rest of the page dimmed, and Next moving on to the following thing, scrolling to it and opening whatever hides it. Use it to show how a sandbox works ("these run the model"), to walk through a chapter's key parts, or to demonstrate a finding ("press Play and watch this rule fire").

Each step is a little HTML naming what it points at, so a tour takes a few lines to write and survives changes to the layout. The tour never searches the page: the sandbox goes to each step's ref and hands the tour the element to point at.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-tour/sb-tour.js"></script>

<sb-tour id="basics" heading="How this sandbox works">
  <div data-step>Here's how to explore this sandbox.</div>
  <div data-step data-at="controls">These run the model. Press <b>Play</b>.</div>
  <div data-step data-at="RUL-014" data-wait>Watch this rule light up when a store runs low.</div>
  <div data-step>That's the loop: run, watch, question.</div>
</sb-tour>

<script>
  const tour = document.querySelector('sb-tour');
  tour.addEventListener('sb-step', (e) => {
    tour.anchor = e.detail.ref ? goTo(e.detail.ref) || null : null;   // goTo: practices/locating.md
  });
  model.onRuleFired((rule) => { if (rule === 'RUL-014') tour.ready = true; });
  startButton.addEventListener('click', () => tour.start());
</script>
```

## Markup

| Mark | On | Meaning |
|---|---|---|
| `data-step` | a direct child | A step: what the tooltip says. Any HTML. Shown one at a time, in order. Steps added later join when the tour starts. |
| `data-at="ref"` | a step | What the step points at. Without it, the step shows in the middle of the window, with nothing spotlit: for openings and endings. |
| `data-wait` | a step | Next stays off until the sandbox sets `ready`, for a step that asks the viewer to do something first. The sandbox decides what counts. |
| `data-*` | a step | Anything else the step should set, such as a scenario or a view to go to; read it from `element.dataset` on `sb-step`. |

A step names its target with `data-at`, not `data-ref`: it's a way to a place, not a place, so the page never finds a tour step where the thing itself appears.

## Attributes

| Attribute | Meaning |
|---|---|
| `heading` | Shown at the top of the tooltip. |
| `id` | Lets the tour remember whether each viewer has finished it. |

## Properties and methods

| Member | Meaning |
|---|---|
| `start(index)` | Open the tour at a step (the first by default), firing `sb-step`. |
| `next()`, `back()` | Move a step, as the buttons do, firing `sb-step`. Next on the last step finishes the tour; on a waiting step that isn't `ready`, it does nothing. |
| `close()` | Close the tour, firing `sb-close` with `reason: 'close'`. |
| `anchor` | The element the step points at, handed over by the sandbox on `sb-step`, or `null`. The first one a step gets is scrolled into view if it isn't already. A step with `data-at` and no anchor says "Can't find … on this page", so a broken tour shows it rather than pointing at nothing. |
| `ready` | For a `data-wait` step: `true` lets the viewer move on. Every step starts not ready. |
| `current` | `{ index, ref, element }` for the step showing, or `null` while closed. |
| `open` | Whether it's showing. |
| `steps` | The step elements, in order. |
| `seen` | Read only. Whether this viewer has finished the tour before (needs an `id`). Starting it on a first visit is the sandbox's choice. |

Setting `anchor` and `ready` never fires events.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-step` | `{ index, ref, element }` | A step starts, by `start`, Next or Back. Go to `ref` and set `anchor`. The same event and detail as `sb-walkthrough`'s, so a sandbox handles both alike. Bubbles. |
| `sb-close` | `{ index, reason }` | The tour closed: `done` (finished), `close` (the Close button or `close()`) or `escape`. Bubbles. |

## Viewing

- **The spotlight** outlines the part pointed at and dims the rest of the page. The dimming only dims: clicks pass through, so the part, and the page around it, stay usable, and a waiting step can ask the viewer to press something.
- **Scrolling:** when a step's part isn't in full view, the page scrolls to bring it to the middle of the window, or its top for a part taller than the window.
- **The tooltip** sits below the part, or above it if there's no room, kept on screen. The spotlight and the tooltip follow the part as the page scrolls or resizes, and as the part itself moves or changes size while the viewer works with it.
- **A part redrawn** as a new element: set `anchor` to the new one. Within a step, that never scrolls the page again.
- **Keyboard:** the tooltip takes focus when a step starts. Arrow keys move, Enter moves on, Escape closes, and focus returns where it was.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-text`, `--sb-warn`, `--sb-font`, `--sb-radius`.

Its own custom property, to set on the page: `--sb-tour-dim` (the dimming's colour; default a translucent black, so it reads alike in light and dark themes).

Classes: `sb-tour__spotlight` (`--anchored`), `sb-tour__tip`, `sb-tour__heading`, `sb-tour__steps`, `sb-tour__missing`, `sb-tour__controls`, `sb-tour__count`, `sb-tour__button` (`--next`), `sb-tour__close`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[The locating practice](../../practices/locating.md).** Its `goTo` goes to a ref, opening closed tabs and folded branches on the way, and returns the place to point at. When a step means a particular view (the diagram rather than the outline), carry it on the step as `data-*` and call that view's `reveal` instead.
- **[`sb-walkthrough`](../sb-walkthrough/manifest.md),** where something else fits: a walkthrough lays out its own views and tells a story across them; a tour points at the page as it already is, anywhere on it.
- **The shell's header:** a "Take the tour" button in `slot="actions"`.

## Notes

- **One at a time:** each tour is its own element. Keep only one open by closing the others before `start`.
- **Top layer:** the spotlight and tooltip use the browser's popover API, so they sit above everything, floating panels included.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-tour`, the console says so. Replace every `sb-tour` in `sb-tour.js` to give this copy a new name.
