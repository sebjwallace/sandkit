# sb-scenario

A behaviour scenario as a card: its code, its title, and its Given / When / Then steps, laid out so they read at a glance. Use it wherever a sandbox states how something should behave: what a grid does when a generator trips, what a signal does when a train passes it, what a protocol does when a message is lost.

The card knows nothing about the domain. The sandbox writes the steps and decides what clicking one means; the card makes them clear, lights up the ones being talked about, and marks where the model has got to.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-scenario/sb-scenario.js"></script>

<sb-scenario></sb-scenario>

<script>
  const card = document.querySelector('sb-scenario');
  card.scenario = {
    code: 'GRID-1',
    title: 'A large generator trips',
    steps: [
      { keyword: 'Given', text: 'the grid is running at 50.0 Hz', ref: 'GRID-1.given' },
      { keyword: 'When', text: 'generator "G2" trips, losing 400 MW', ref: 'GRID-1.when' },
      { keyword: 'Then', text: 'frequency falls below 49.2 Hz', ref: 'GRID-1.then' },
      { keyword: 'And', text: 'stage 1 load shedding disconnects 10% of demand', ref: 'GRID-1.shed' }
    ]
  };
  card.addEventListener('sb-select', (e) => {
    card.current = e.detail.index;
    model.moveTo(e.detail.step.ref);
  });
</script>
```

## Scenario

| Field | Required | Meaning |
|---|---|---|
| `code` | no | The scenario's identifying code, shown as a label and used to light up the whole card. |
| `title` | yes | What the scenario is about, in a few words. |
| `steps` | yes | The steps in order, below. |

Each step:

| Field | Required | Meaning |
|---|---|---|
| `keyword` | yes | `Given`, `When`, `Then`, `And`, `But` or `*`. Shown in capitals. And, But and `*` carry on the keyword before them, so they sit under it, fainter. |
| `text` | yes | The rest of the step, as plain text. Quoted text and numbers are marked as values. |
| `ref` | no | Identifies the step for `highlight`, and is carried as `data-ref`. |

## Properties

| Member | Meaning |
|---|---|
| `scenario` | Get or set the scenario. |
| `highlight` | An array of refs to light up: the scenario's `code` lights the card, a step's `ref` lights its line. |
| `current` | The index of the step the model is at. It's marked and later steps fade. `null` (the default) shows them all plainly. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ scenario, step, index }` | A step is clicked, or chosen with Enter or Space. Only reported: set `current` if it should move. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-radius`.

Classes: `sb-scenario` (`--highlighted`), `sb-scenario__head`, `sb-scenario__code`, `sb-scenario__title`, `sb-scenario__steps`, `sb-scenario__step` (`--opens` for Given, When and Then, `--continues` for And and But, `--highlighted`, `--current`, `--upcoming`), `sb-scenario__keyword`, `sb-scenario__text`, `sb-scenario__value`, `sb-scenario__empty`. The card carries `data-ref` with its code, and each step with a `ref` carries `data-ref` with it, so a sandbox can find them (see the [locating practice](../../practices/locating.md)). The current step is marked `aria-current="step"`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, so prose can point at a scenario or one of its steps. A phrase that means several steps, such as "the same starting point" across two scenarios, can map to all their refs at once.
- **[`sb-controls`](../sb-controls/manifest.md) or [`sb-scrubber`](../sb-scrubber/manifest.md),** to play a scenario through the model: on each step, run it and set `current` to it.
- **A view of the model's state,** such as [`sb-stat`](../sb-stat/manifest.md) or [`sb-graph`](../sb-graph/manifest.md). On `sb-select`, move the model to that step and let the view show what the step means.
- **[`sb-id`](../sb-id/manifest.md)** pills in the prose citing a scenario's code.

## Notes

- **Readability:** a card is one scenario. Give each its own card, a few side by side, so viewers can compare them; split a long feature across views rather than stacking dozens.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** steps are focusable and chosen with Enter or Space. Keywords are capitalised by CSS, so screen readers and copying keep the words as written.
- **Renaming:** if another component on the page is already called `sb-scenario`, the console says so. Replace every `sb-scenario` in `sb-scenario.js` (tag, classes and style id all use it) to give this copy a new name.
