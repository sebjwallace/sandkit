# sb-scrubber

A bounded stretch of progress that people can scrub back and forth, or play at a steady pace: a transformation from start to finish, a year of seasons, a ball's flight, the stages of a process. Named marks pick out the moments that matter, and clicking one jumps there.

Use it when progress has a beginning and an end. For a model that steps forward without end, use [`sb-controls`](../sb-controls/manifest.md) instead.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-scrubber/sb-scrubber.js"></script>

<sb-scrubber min="0" max="1" step="0.01" duration="2" label="Transformation"></sb-scrubber>

<script>
  const scrubber = document.querySelector('sb-scrubber');
  scrubber.format = (t) => `${Math.round(t * 100)}% applied`;
  scrubber.marks = [{ value: 0, label: 'before' }, { value: 1, label: 'after' }];
  scrubber.addEventListener('sb-change', (e) => { plane.progress = e.detail.value; });
</script>
```

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `min`, `max` | `0`, `1` | The range. |
| `step` | any | The slider's step, such as `0.01` or `1`. |
| `duration` | `2` | Seconds to play from `min` to `max`. |
| `loop` | off | Keep playing round from the end to the start. |
| `label` | `Progress` | What the slider is called, for screen readers. |

## Properties and methods

| Member | Meaning |
|---|---|
| `value` | The current position. Setting it moves the scrubber without firing `sb-change`. |
| `marks` | `[{ value, label }]`: named moments, placed along the range. Clicking one jumps there. |
| `format` | A function from value to the text shown above the slider. |
| `playing` | Read-only. Whether it is playing. |
| `play()`, `pause()` | Start or stop playing. Playing from the end starts again at the beginning. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-change` | `{ value }` | The position changes because the viewer scrubbed, clicked a mark, or it is playing. Fires continuously while playing. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-radius`.

Classes: `sb-scrubber__play`, `sb-scrubber__input`, `sb-scrubber__label`, `sb-scrubber__marks`, `sb-scrubber__mark` (with `--current` when the scrubber is exactly there).

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-plane`](../sb-plane/manifest.md),** to scrub through a transformation: set the plane's `progress` from `sb-change`.
- **[`sb-chart`](../sb-chart/manifest.md),** with a reference line at the scrubber's value to show where in a history the viewer is looking.

## Notes

- **Scrubbing or clicking a mark pauses playback,** so the viewer is always in control.
- **Keep mark labels short.** Marks close together on a narrow scrubber can collide.
- **Stops playing when removed from the page.**
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** a native range slider with arrow-key support, labelled, reporting its formatted value.
- **Renaming:** if another component on the page is already called `sb-scrubber`, the console says so. Replace every `sb-scrubber` in `sb-scrubber.js` to give this copy a new name.
