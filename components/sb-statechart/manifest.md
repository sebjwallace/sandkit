# sb-statechart

A statechart: states that hold other states, parallel regions running side by side, history, guards and actions. Use it wherever something behaves by what state it's in: a device, a protocol, an order's lifecycle, a traffic junction, a game character, a user interface.

It shows every state that's active at once, the innermost ones and everything around them. It marks what can happen now, including transitions inherited from an enclosing state, and those a guard is holding back. It numbers what the last step did in order: the states it exited, the transitions it fired and the states it entered, with the actions each ran. That order is the hardest part of a statechart to picture. History states show what they would bring back, and compound states fold into one box.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-statechart/sb-statechart.js"></script>

<sb-statechart sendable></sb-statechart>

<script>
  const chart = document.querySelector('sb-statechart');
  chart.machine = { initial: 'stopped', states: {
    stopped: { on: { PLAY: 'playing' } },
    playing: { initial: 'normal', entry: 'start audio', exit: 'stop audio', on: { STOP: 'stopped', PAUSE: 'paused' }, states: {
      normal: { on: { FF: 'fast' } },
      fast: { on: { FF: 'normal' } },
      resume: { type: 'history' }
    } },
    paused: { on: { PLAY: 'resume', STOP: 'stopped' } }
  } };

  chart.state = chart.initial();
  chart.addEventListener('sb-send', (e) => { chart.state = chart.next(chart.state, e.detail.event); });
</script>
```

## Two ways to use it

- **The chart is the model.** A concept explained on its own page, or a small model of state sitting beside the sandbox's main model. Write the machine, start it with `initial()`, and on each event set `state` to `next(state, event)`. Run the returned `last.actions` if they should do something.
- **The model has states of its own.** The sandbox's main model already moves between states in its own way. Describe those states as a machine, and on each change set `state` from the model: `active` from where the model is, and `last` from what it just did. Never call `next()`, so the model alone decides.

Either way, the component only shows what it's given. `initial()` and `next()` work out an answer and hand it back, changing nothing.

## The machine

Shaped like an [XState](https://stately.ai/docs/xstate) config, simplified, with no library needed. `machine` is `{ initial, type, states }`. Each entry in `states` is a state, named by its key:

| Field | Meaning |
|---|---|
| `states` | The states inside this one, making it compound. |
| `initial` | The state inside entered by default. Defaults to the first. |
| `type` | `parallel` (its states are regions, all active together), `final`, or `history`. Otherwise atomic or compound, from whether it has `states`. |
| `history` | For a history state: `shallow` (default) brings back the state active inside its parent; `deep` everything active within it. |
| `target` | For a history state: where to go when it remembers nothing. Defaults to its parent's initial state. |
| `on` | `{ EVENT: transition }`. A transition is a target's name, `{ target, guard, actions }`, or a list of them, tried in order. Without a target, it runs its actions and leaves nothing. |
| `entry`, `exit` | An action, or a list of them, run on entering and leaving. |
| `label` | Shown in place of the name. |
| `tone` | `good`, `warn` or `bad`, coloured with the theme's status tokens. |

Names are unique across the whole machine, and targets use them. A transition's id is `source:EVENT`, or `source:EVENT:n` when an event has several. The machine's own `on` is ignored, so put the transition on a state instead. Guards and actions are text: the component never runs them, and learns whether a guard passes from `guards`.

## How it moves

`next()` follows the statechart semantics of SCXML:

- **Choosing.** For each innermost active state, the first transition for the event whose guard passes fires: the state's own, or else its nearest ancestor's. In parallel regions, each region can fire its own.
- **Leaving.** A transition leaves every active state inside the innermost compound state that holds both ends. Innermost states go first. A transition to its own state leaves and comes in again.
- **Entering.** The target and the states around it are entered outermost first, with each compound state's initial state, every region of a parallel state, and whatever a history state remembers.
- **Actions.** Exit actions run first, then the transitions' actions, then entry actions.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `sendable` | off | Shows the events that can happen now as buttons, with those held back by a guard crossed out. Clicking a button, or a transition that can fire, sends `sb-send`. The chart doesn't change; the sandbox sets `state`. |

## Properties and methods

| Member | Meaning |
|---|---|
| `machine` | The machine. Setting it lays it out again, keeping the state. `null` shows nothing. Throws if a target isn't a state. |
| `state` | Where it is: `{ active, history, last }`. `active` names the innermost active states, and their ancestors count as active too. `history` is `{ historyName: [names] }`. `last` is `{ event, transitions, exited, entered, actions }`, as lists of names and ids. Every field is optional. `null` clears it. |
| `guards` | `{ guard: true \| false }`: which guards pass now. A guard not named passes. |
| `folded` | Names of compound or parallel states drawn folded as one box, with what happens inside counted against the box. |
| `highlight` | Names of states, or ids of transitions, to point at. |
| `initial()` | The state the machine starts in, with `last` recording everything entered to get there. |
| `next(state, event, guards = this.guards)` | The state after `event`. `last` records what fired, exited and entered, and the actions in order. If nothing answers the event, `last.transitions` is empty. |

With a state, the transitions that would fire now are marked, and the rest faded. The last step's exits, transitions and entries are numbered on the chart, and spelled out in a line beneath it ("Last: PAUSE: 1 exit fast · 2 exit playing (stop audio) · 3 playing → paused · 4 enter paused"), each transition named by where it runs from, so an inherited one shows as such.

Setting properties and calling methods never fires the events below; they are for what viewers do.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-send` | `{ event }` | With `sendable`, a viewer clicks an event's button or a transition that can fire. Bubbles. |
| `sb-select` | `{ id, state }` | A state is clicked. `state` is its definition as given. Bubbles. |
| `sb-point` | `{ id, state }`, `{ transition }`, or `null` | The pointer moves onto another state or transition, or leaves the chart. `transition` is `{ id, source, event, target, guard, actions }`. Bubbles. |
| `sb-toggle` | `{ id, folded }` | A viewer folds or unfolds a state with its control. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-surface`, `--sb-border`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Classes:
- **States:** `sb-statechart__state` (carries `data-state-id`), with the kind (`--atomic`, `--compound`, `--parallel`, `--region`, `--final`, `--history`), `--folded`, the tone, `--active` and `--highlighted`. Inside it: `sb-statechart__shape`, `sb-statechart__label`, `sb-statechart__detail`, `sb-statechart__divider`, `sb-statechart__fold`, `sb-statechart__region-line`, `sb-statechart__history`, `sb-statechart__remembered`.
- **Transitions:** `sb-statechart__transition` and `sb-statechart__transition-label`, both carrying `data-transition-id`, with `--enabled`, `--blocked`, `--taken` and `--highlighted`. Inside them: `sb-statechart__line`, `sb-statechart__arrow`.
- **Starts:** `sb-statechart__start`, with `sb-statechart__initial` for the dot.
- **The last step:** `sb-statechart__badge` (`--exit`, `--transition`, `--enter`; carries `data-badge-for`) and `sb-statechart__step`.
- **Events:** `sb-statechart__events` and `sb-statechart__event`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-log`](../sb-log/manifest.md),** to keep every step: on each `next()`, add an entry with the event and `last.actions`.
- **[`sb-parameters`](../sb-parameters/manifest.md),** for the figures guards depend on: on each change, set `guards`, and watch transitions open and close.
- **[`sb-sequence`](../sb-sequence/manifest.md),** when several machines talk to each other: one statechart each, and the messages between them as a sequence.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, and announce a state's ref from `sb-point`, so a state and its mentions in the prose light up together.

## Notes

- **Layout:** automatic. Inside each compound state, its states sit in columns from left to right, each a step further from the initial state, with loops set aside. Parallel regions are stacked and divided by dashed lines. Transitions curve around states they have nothing to do with, and their labels keep clear of states and of each other.
- **Size:** drawn at its real size, never scaled. It takes the width of its container, and a wider chart scrolls within it. Made for machines of up to a few dozen states; fold the rest away.
- **Left for later:** eventless (`always`) and delayed (`after`) transitions, done events from final states, and positions placed by hand all wait until a sandbox needs them. Until then, the sandbox sends such events itself.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-statechart`, the console says so. Replace every `sb-statechart` in `sb-statechart.js` (tag, classes and style id all use it) to give this copy a new name.
