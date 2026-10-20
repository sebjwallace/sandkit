# sb-poll

A question put to a group, the way polls usually work: each person answers, and once everyone has, all the answers are revealed at once, grouped by option, with who chose each and why. Until then the poll shows who has answered, never what, so nobody's answer steers anyone else's. Use it wherever a sandbox asks people for an answer: a reader predicting before a simulation runs, a check at the end of a chapter, a group saying how sure they are or which design they prefer. One person on their own works too: the poll simply asks before it shows.

**With an `outcome`, a poll is a prediction.** Ask what will happen before the model shows it; on the reveal, the option that held is marked "What happened", each answer ✓ or ✗, and the summary says how many expected it. A miss is where someone's picture of the subject, or the model's, needs work.

Options needn't be words. Slot any content into an option, such as an image, a sketch, a small chart or a prototype, and people choose between those.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-poll/sb-poll.js"></script>

<sb-poll question="A once-a-century storm: how many homes flood?" reasons></sb-poll>

<script>
  const poll = document.querySelector('sb-poll');
  poll.options = [{ id: 'none', label: 'None' }, { id: 'some', label: 'Up to 200' }, { id: 'many', label: 'Over 200' }];
  poll.people = [{ id: 'priya', name: 'Priya Shah', role: 'Engineer' }, { id: 'tom', name: 'Tom Hale', role: 'Planner' }];

  // The sandbox keeps the answers; the poll asks it to record each one, and to reveal.
  const answers = {};
  poll.addEventListener('sb-answer', (e) => {
    const { person, option, why } = e.detail;
    answers[person] = { option, why };
    poll.answers = answers;
  });
  poll.addEventListener('sb-reveal', () => {
    poll.outcome = model.homesFlooded(100) > 200 ? 'many' : 'some';   // only for a prediction
    poll.revealed = true;
  });
</script>
```

A rating, such as "how confident are you, 1 to 5?", is five options labelled `1 · Not at all` to `5 · Completely`.

## Slots

Children marked with a slot are put in place, and moved, never copied, when the poll is revealed:

| Slot | Where it goes |
|---|---|
| `slot="option:<id>"` | In place of that option's label: in its choice card while asking, and heading its group once revealed. Any content. |
| `slot="person:<id>"` | In place of that person's name: among who has answered while asking, and beside their answer once revealed. A badge suits it. |

Without a slot, the option's `label` and the person's `name` show. Give every option a `label` anyway: the picker, `describe()` and screen readers use it.

## Data

| Property | Meaning |
|---|---|
| `options` | `[{ id, label, ref }]`: what people choose between, in order. `ref` lets an option take part in highlighting. |
| `people` | `[{ id, name, role }]`: who is answering. |
| `answers` | `{ [person]: { option, why } }`: the answers given. The sandbox keeps them, from `sb-answer`, and sets them here. |
| `revealed` | Whether the answers show. Set it on `sb-reveal`, or straight away to show results already in. |
| `outcome` | The `id` of the option that held, making the poll a prediction. Shown only once revealed. Work it out from the model, before or at the reveal. |
| `notes` | `{ [person]: text }`: a reply to each answer, such as an agent's after the reveal, shown under it. |

## Attributes

| Attribute | Meaning |
|---|---|
| `question` | The question, shown at the top. Also a property. |
| `reasons` | Asks each person "Why?" as they answer, shown with their answer once revealed. Predictions want it; quick polls often don't. |

## Properties and methods

| Member | Meaning |
|---|---|
| `highlight` | Refs of options to light up. |
| `describe()` | The poll as plain text, for a prompt: the question and options, then who has answered (before the reveal) or every answer with its reason and, for a prediction, ✓ or ✗ (after). |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-answer` | `{ person, option, why }` | Someone submits an answer. Record it and set `answers`; the poll shows nothing new until then. Bubbles. |
| `sb-reveal` | `{}` | Reveal is pressed. It's enabled only once everyone has answered. Set `revealed`, and `outcome` for a prediction. Bubbles. |

## What it shows

- **While asking:** who is answering, each marked "Answered · hidden" or "Not answered yet"; a form with "I am", offering only those yet to answer, the options as cards to choose, "Why?" with `reasons`, and Submit; then "3 of 5 have answered" and Reveal.
- **Once revealed:** every option as a group, in order, with how many chose it and each of them, their reason and any note. Options nobody chose say so. For a prediction, a summary ("2 of 5 expected what happened"), the outcome's group marked "What happened", and ✓ or ✗ beside each person.

## Highlighting

Follows the [highlighting practice](../../practices/highlighting.md):

| Announces | Lights up |
|---|---|
| an option's `ref`, while pointed at | the options whose `ref` is announced |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-bad`, `--sb-radius`, `--sb-font`.

Its own custom property: `--sb-poll-option-width`, the narrowest an option card gets before they wrap (`150px`). Widen it for options holding pictures.

Classes: `sb-poll__question`, `sb-poll__people`, `sb-poll__person` (`--waiting`), `sb-poll__name`, `sb-poll__status`, `sb-poll__form`, `sb-poll__label`, `sb-poll__options`, `sb-poll__option` (`aria-pressed` when chosen; `--highlighted`), `sb-poll__option-label`, `sb-poll__button`, `sb-poll__foot`, `sb-poll__summary`, `sb-poll__groups`, `sb-poll__group` (`--outcome`, `--highlighted`), `sb-poll__group-head`, `sb-poll__count`, `sb-poll__held`, `sb-poll__answer`, `sb-poll__answer-head`, `sb-poll__mark` (`--right`, `--wrong`), `sb-poll__why`, `sb-poll__note`, `sb-poll__nobody`. Options and groups carry `data-option`, and `data-ref` when given a ref; answers carry `data-person`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-person`](../sb-person/manifest.md)** in each `person:<id>` slot, so people show as their badges.
- **[`sb-handoff`](../sb-handoff/manifest.md),** to send the revealed poll to an agent: give it `poll.describe()` as part of the prompt, and put the agent's replies to each answer in `notes`.
- **[`sb-scenario`](../sb-scenario/manifest.md)** above a prediction, with the outcome step left out until the reveal; then [`sb-chart`](../sb-chart/manifest.md) or the model's own view, so people see why it went the way it did.
- **[`sb-stat`](../sb-stat/manifest.md)** in a person slot beside a badge, for a rating shown as a figure with a bar.

## Notes

- **Readability:** a poll is one question, with a handful of options and of people. Several questions are several polls.
- **Hidden means hidden on this screen.** On a shared screen, people take turns at the form. The answers live in the sandbox, so where people answer on their own devices, the sandbox gathers them.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** options are buttons that say whether they're chosen; the question labels the group of them.
- **Renaming:** if another component on the page is already called `sb-poll`, the console says so. Replace every `sb-poll` in `sb-poll.js` (tag, classes and style id all use it) to give this copy a new name.
