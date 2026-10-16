# sb-parameters

The knobs of a sandbox: the values people change to see what happens. Each parameter shows as a labelled slider with its live value. Any parameter that differs from its default is marked, with the default shown beneath it, and one button returns everything to the baseline.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-parameters/sb-parameters.js"></script>

<sb-parameters></sb-parameters>

<script>
  const parameters = document.querySelector('sb-parameters');
  parameters.definitions = [
    { key: 'demand', label: 'Customer demand', min: 0.5, max: 2.5, step: 0.1, value: 1, unit: '×' },
    { key: 'leadHours', label: 'Delivery time', min: 2, max: 48, value: 12, unit: 'hours' }
  ];
  parameters.addEventListener('sb-change', (e) => model.setOption(e.detail.key, e.detail.value));
</script>
```

Set the model's starting options to the same defaults, or apply `parameters.values` once at start.

## Definition

| Field | Required | Meaning |
|---|---|---|
| `key` | yes | The name the sandbox knows the parameter by. Reported in `sb-change`. |
| `min`, `max` | yes | The range. Values are kept within it. |
| `value` | yes | The default. Reset returns to it, and changes are measured from it. |
| `label` | no | What people see. Defaults to `key`. |
| `step` | no | Defaults to `1`. Values show with as many decimal places as the step. |
| `unit` | no | Shown after the value. Word units are spaced (`12 hours`); symbols attach (`1.5×`). |
| `format` | no | A function from value to text, replacing the default formatting. |

## Properties and methods

| Member | Meaning |
|---|---|
| `definitions` | Get or set the parameters. Setting them resets every value to its default. |
| `values` | Get the current values by key, or set some of them (for example, to restore a saved state). Values outside the range are clamped. |
| `reset()` | Return every parameter to its default. Fires `sb-change` for each one that changes. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-change` | `{ key, value, values }` | A value changes, by sliding or by reset. Fires continuously while dragging. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-radius`.

Classes: `sb-parameters__parameter` (carries `data-key`, and `data-changed` when it differs from its default), `sb-parameters__label`, `sb-parameters__value`, `sb-parameters__input`, `sb-parameters__default`, `sb-parameters__reset`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-id`](../sb-id/manifest.md), to cite where a default comes from.** Put a pill in the parameter's slot, and it sits beside the parameter's name:
  ```html
  <sb-parameters>
    <sb-id slot="gravity" code="PAR-001"></sb-id>
  </sb-parameters>
  ```
- **A live view of the model,** such as a chart, a simulation or a count, so people see the effect as they slide.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** each slider has a linked label, and reports its formatted value to screen readers.
- **Renaming:** if another component on the page is already called `sb-parameters`, the console says so. Replace every `sb-parameters` in `sb-parameters.js` to give this copy a new name.
