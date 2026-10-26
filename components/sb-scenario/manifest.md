# sb-scenario

A behaviour scenario as a card: its code, its title, and its Given / When / Then steps, laid out so they read at a glance. Use it wherever a sandbox states how something should behave: what a grid does when a generator trips, what a signal does when a train passes it, what a protocol does when a message is lost.

The card knows nothing about the domain. The sandbox writes the steps and decides what clicking one means; the card makes them clear, lights up the ones being talked about, marks where the model has got to, and shows which steps played out as expected when the model plays the scenario, with what actually happened where they didn't, so turning a knob shows exactly which outcome stops coming true and what came instead.

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

  // On every change to the model, play the scenario and check its outcomes:
  const lowest = model.lowestFrequency(400);
  const falls = lowest < 49.2;
  card.results = [null, null, { ok: falls, actual: falls ? null : `fell only to ${lowest} Hz` }, model.sheds(400)];
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
| `results` | Each step's result by index, from the model playing the scenario: `true` as expected (✓), `false` not as expected (✗, the step in the theme's bad colour), `null` not checked, or `{ ok, actual }`, where `actual` says in plain text what really happened, shown under the step. Usually only the outcomes are checked; a Given the model doesn't match is a result too. Defaults to `[]`. |

Once any step is checked, the card says whether the scenario played out **as expected** or **not as expected** (any checked step that wasn't), and a scenario not as expected is outlined in the theme's bad colour.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ scenario, step, index }` | A step is clicked, or chosen with Enter or Space. Only reported: set `current` if it should move. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-bad`, `--sb-radius`.

Classes: `sb-scenario` (`--highlighted`), `sb-scenario__head`, `sb-scenario__code`, `sb-scenario__title`, `sb-scenario__outcome`, `sb-scenario__steps`, `sb-scenario__step` (`--opens` for Given, When and Then, `--continues` for And and But, `--highlighted`, `--current`, `--upcoming`, `--expected`, `--unexpected`), `sb-scenario__keyword`, `sb-scenario__text`, `sb-scenario__value`, `sb-scenario__result`, `sb-scenario__actual`, `sb-scenario__empty`. The card and its outcome label carry `data-outcome` (`expected` or `unexpected`). The card carries `data-ref` with its code, and each step with a `ref` carries `data-ref` with it, so a sandbox can find them (see the [locating practice](../../practices/locating.md)). The current step is marked `aria-current="step"`.

## Notes

- **The card never runs a scenario.** The model plays it and says which steps came out as expected and what actually happened; the card shows it.
- **Readability:** a card is one scenario. Give each its own card, a few side by side, so viewers can compare them; split a long feature across views rather than stacking dozens.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** steps are focusable and chosen with Enter or Space. Keywords are capitalised by CSS, so screen readers and copying keep the words as written.
- **Renaming:** if another component on the page is already called `sb-scenario`, the console says so. Replace every `sb-scenario` in `sb-scenario.js` (tag, classes and style id all use it) to give this copy a new name.
