# sb-timeline

Events laid out in time: the course of a war, the life of a project, an infection and the immune response, a patient's stay, the history of an idea. Use it wherever a sandbox's subject is a story of things happening, and when they happened relative to each other matters.

Moments and spans sit in lanes, one per person, place or thread, so what overlapped and what came first shows at a glance. A line marks now: what hasn't happened yet is faded, and a span running through now shows how far along it is. Viewers zoom and pan, and setting `view` glides the timeline to the stretch the prose is about.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-timeline/sb-timeline.js"></script>

<sb-timeline scrubbable></sb-timeline>

<script>
  const timeline = document.querySelector('sb-timeline');
  timeline.lanes = [
    { id: 'body', label: 'Body' },
    { id: 'immune', label: 'Immune system' }
  ];
  timeline.events = model.events;   // [{ id: 'fever', label: 'Fever', at: 2, end: 5, lane: 'body' }, …]
  timeline.format = (day) => `Day ${day}`;
  timeline.now = model.day;

  timeline.addEventListener('sb-now', (e) => {
    model.goTo(Math.round(e.detail.value));
    timeline.now = model.day;
  });
</script>
```

## Time

Time is plain numbers in whatever unit the sandbox uses: years, days, seconds, steps of a model. `format` turns a number into the text people see, on the axis and elsewhere. Fractions are fine, so a year can be `1944.43`.

## Lanes and events

| Lane field | Meaning |
|---|---|
| `id` | Identifies the lane; events name it in `lane`. |
| `label` | Shown at the lane's left. Defaults to `id`. |

| Event field | Meaning |
|---|---|
| `id` | Identifies the event across updates, for `highlight`. Required. |
| `label` | The event's text. Defaults to `id`. Keep it short; the `note` holds the rest. |
| `at` | When it happens, or begins. |
| `end` | Optional. When it ends, making it a span drawn as a bar. Without it, the event is a moment, drawn as a dot. |
| `lane` | The `id` of its lane. With lanes set, events in a lane that isn't listed aren't shown. |
| `note` | Optional. Shown with the time when the event is pointed at, and read to screen readers. |
| `tone` | `good`, `warn` or `bad`. Colours the dot or bar. |

Events that would overlap, labels included, are given rows of their own within their lane, and the lane grows to fit.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `scrubbable` | off | Viewers can drag the now line, or press along the axis, firing `sb-now`. The line doesn't move; the sandbox sets `now`. The now line can also be focused, and the arrow keys ask for the previous or next moment something starts or ends. |
| `empty-text` | `Nothing yet.` | Shown with no events. |

## Properties and methods

| Member | Meaning |
|---|---|
| `lanes` | The lanes, top to bottom. With none, every event shares one unlabelled lane. |
| `events` | The events. |
| `now` | The present, or `null` for none. Events after it are faded; a span running through it is filled up to it. |
| `view` | `[from, to]`: the stretch to show. Setting it glides there, undoing viewers' zooming. `null`, the default, fits every event and `now`, with a margin. |
| `shown` | Read only. The `[from, to]` in the frame now, after viewers' zooming and panning. |
| `format` | A function from a time to its text. Defaults to the number, to two decimal places at most. |
| `highlight` | `{ events: [id, …], lanes: [id, …] }`: what to point at. |
| `reset()` | Glides back to `view`. The same as the circling arrow. |

Setting properties never fires the events below; they are for what viewers do.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-now` | `{ value }` | On a `scrubbable` timeline, the viewer drags the now line or along the axis (continuously, while dragging), or presses an arrow key on the line. A request: nothing moves until the sandbox sets `now`. Bubbles. |
| `sb-select` | `{ event }` | An event is clicked, or Enter is pressed on it. Bubbles. |
| `sb-point` | `{ event }`, or `null` | The pointer moves onto another event, or leaves the timeline. Bubbles. |

## Zooming and panning

Viewers drag a lane to pan, scroll sideways to pan, and hold Ctrl or ⌘ while scrolling (or pinch on a trackpad) to zoom, so a plain scroll still scrolls the page. The buttons under the lane labels zoom in, zoom out and go back to `view`. Zooming reaches from a thousandth of the view out to four times it.

Viewers' zooming survives new `events` and `now`, so a running model doesn't snatch the view from someone looking closely. Setting `view` or calling `reset()` takes it back.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`.

Classes: `sb-timeline__frame` (`--dragging`), `sb-timeline__label` and `sb-timeline__track` (both `--highlighted`; carry `data-lane`), `sb-timeline__event` (`--point`, `--span`, `--future`, `--ongoing`, `--highlighted`; carries `data-id` and `data-tone`, and `data-ref` with the event's id so a sandbox can find it: see the [locating practice](../../practices/locating.md); a lane's label carries `data-ref` with the lane's id), `sb-timeline__overlay`, `sb-timeline__grid`, `sb-timeline__now`, `sb-timeline__now-label`, `sb-timeline__axis`, `sb-timeline__tick`, `sb-timeline__tools`, `sb-timeline__tool`, `sb-timeline__empty`. While gliding, the element has `sb-timeline--glide`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-scrubber`](../sb-scrubber/manifest.md),** to play history at a steady pace: set `now` on its `sb-change`, and move the scrubber on the timeline's `sb-now`.
- **[`sb-controls`](../sb-controls/manifest.md),** to run a model that adds events as it goes: on each tick, step it and set `events` and `now`.
- **[`sb-log`](../sb-log/manifest.md),** for the same events as a list with their detail: select an event in one and highlight it in the other.
- **[`sb-chart`](../sb-chart/manifest.md),** for a measure over the same stretch: give both the same range, and set the chart's `current` to `now`.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, and announce an event's ref from `sb-point`, so an event and its mentions elsewhere light up together. Prose can set `view` to glide to the stretch it is talking about.

## Notes

- **Accessibility:** events are focusable, labelled with their time and note; Enter selects. On a scrubbable timeline, the now line is a focusable slider stepped by the arrow keys.
- **Size:** made for tens of events, up to a hundred or two. Rows are shared out for the width at `view`; zooming out past it may let labels overlap.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-timeline`, the console says so. Replace every `sb-timeline` in `sb-timeline.js` (tag, classes and style id all use it) to give this copy a new name.
