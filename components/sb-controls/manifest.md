# sb-controls

Play, pause, step, reset and speed for anything that runs over time. The controls keep the clock: while playing, they fire `sb-tick` with how many steps to take, so the sandbox only steps its model and redraws. Fast speeds take several steps per tick, so even thousands of steps a second stay smooth.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-controls/sb-controls.js"></script>

<sb-controls></sb-controls>

<script>
  const controls = document.querySelector('sb-controls');
  controls.addEventListener('sb-tick', (e) => {
    for (let i = 0; i < e.detail.steps; i++) model.step();
    if (model.state.halted) controls.running = false;   // a model that can stop
    controls.label = `Step ${model.state.time}`;
    render();
  });
  controls.addEventListener('sb-reset', () => { model.reset(); render(); });
</script>
```

## Properties

| Property | Meaning |
|---|---|
| `running` | Whether the clock is running. Set it to `false` when the model comes to a stop. Setting it fires no event. |
| `speeds` | `[{ label, value }]`, where `value` is steps per second. Default: Slow 2, Normal 10, Fast 60, Turbo 600. |
| `speed` | The current speed, in steps per second. |
| `label` | Text shown at the end of the controls, such as the model's clock. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-tick` | `{ steps }` | Time to take `steps` steps: while playing, at the chosen speed, or once (`steps: 1`) when Step is pressed. |
| `sb-play` | `{}` | The viewer pressed Play. |
| `sb-pause` | `{}` | The viewer pressed Pause. |
| `sb-reset` | `{}` | The viewer pressed Reset. Whether the clock keeps running is up to the sandbox. |
| `sb-speed` | `{ value }` | The viewer chose a speed. |

All events bubble.

## Styling

Theme tokens: `--sb-text`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-radius`.

Classes: `sb-controls__button`, `sb-controls__play`, `sb-controls__speed`, `sb-controls__label`.

## Notes

- **The clock pauses when the controls leave the page,** and resumes if they return while running.
- **After a stall** (for example, a hidden browser tab), the clock catches up by at most a quarter of a second, rather than flooding the model with steps.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-controls`, the console says so. Replace every `sb-controls` in `sb-controls.js` to give this copy a new name.
