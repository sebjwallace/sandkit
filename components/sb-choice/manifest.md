# sb-choice

A decision as a card: the context, the options weighed with their pros and cons, the one chosen, the reason, who decided and when. Use it wherever a sandbox records how a group settled something: which imagery maps a flood, how a team surveys a species, where a reorder point sits, which protocol a network uses.

The card knows nothing about the domain. The sandbox holds the decision and saves it; the card shows it, keeps the options turned down in view, says plainly what the record is missing, and lets a group record a decision during a workshop.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-choice/sb-choice.js"></script>

<sb-choice editable></sb-choice>

<script>
  const card = document.querySelector('sb-choice');
  card.people = ['Mateo Ruiz', 'Hana Kobayashi', 'Yusuf Demir'];
  card.decision = {
    id: 'DEC-3',
    title: 'Which imagery should map the flood?',
    status: 'accepted',
    when: '2026-10-20T07:45',
    deciders: ['Mateo Ruiz', 'Hana Kobayashi'],
    context: 'Crews need a map of the water by 10:00, and the valley is under thick cloud.',
    options: [
      { id: 'a', title: 'Optical satellite imagery', pros: ['Sharp'], cons: ['Blocked by cloud'] },
      { id: 'b', title: 'Radar satellite imagery', pros: ['Sees through cloud'], cons: ['Misreads streets as water'] }
    ],
    chosen: 'b',
    reason: 'We map the flood with radar. Cloud stays all day, and radar is the only view that arrives in time.',
    consequences: ['Drones check the towns by noon'],
    about: ['LYR-2'],
    sources: [{ source: 'SRC-12', quote: 'cloud cover above 80% through Thursday' }],
    replaces: 'DEC-1'
  };
  card.addEventListener('sb-save', (e) => {
    save(e.detail.decision);          // the sandbox keeps it, for example as source material
    card.decision = e.detail.decision;
  });
  card.addEventListener('sb-reopen', (e) => openReplacementFor(e.detail.id));
  card.addEventListener('sb-go', (e) => goTo(e.detail.ref));
</script>
```

## Decision

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | The decision's code, such as `DEC-3`. Shown as a label and carried as `data-ref`. |
| `title` | yes | What is being decided. Best written as a question (see below). |
| `status` | yes | `proposed`, `accepted`, `rejected` or `replaced`. Shown in words as well as colour; rejected and replaced decisions are faded. |
| `when` | no | When it was decided, as `yyyy-mm-ddThh:mm` (shown as "20 Oct 2026, 07:45") or `yyyy-mm-dd`. Anything else is shown as given. |
| `deciders` | no | The names of the people who decided. |
| `context` | no | What led to the decision, as a short paragraph. |
| `options` | no | `[{ id, title, pros, cons }]`, the options weighed. `pros` and `cons` are lists of short phrases. |
| `chosen` | no | The `id` of the option chosen. |
| `reason` | no | Why that option. Best opened with the answer (see below). |
| `consequences` | no | What follows from the decision, as a list. |
| `about` | no | Codes of the model items the decision is about. |
| `sources` | no | Citations, `[{ source, quote }]`, as in the [sources practice](../../practices/sources.md). |
| `replaces` | no | The id of the decision this one replaces. |
| `replacedBy` | no | The id of the decision that replaced this one. The sandbox sets it when the new one is accepted. |

A decision can start as a proposal with only its context and options. Once accepted it's never edited: a change is a new decision that `replaces` the old one.

## Writing a decision to scan

Frame the card as a question and its answer, so a reader gets the decision from two lines without reading the rest:

- **The title asks the question the group faced:** "Which imagery should map the flood?", "How do we count the otters by spring?" A question says what was open. A label like "Imagery" doesn't.
- **The reason opens with the answer, as a statement:** "We map the flood with radar." Then why: "Cloud stays all day, and radar is the only view that arrives in time."

Someone scanning a page of decisions can read only the titles and the first line of each reason and still know what was asked and what was settled. The context, options and consequences are there for whoever wants the detail.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `editable` | off | Lets a group record the decision: an **Edit** button on a proposal, **Reopen** on an accepted decision. |
| `compact` | off | Folds the card to its header, the chosen option and the reason, with **Show all** to unfold. For several decisions together. |

## Properties and methods

| Member | Meaning |
|---|---|
| `decision` | Get or set the decision. Setting it redraws the card and closes the form. |
| `editable` | Get or set the attribute. |
| `people` | Names the deciders can be ticked from in the form. Others can be typed. |
| `highlight` | An array of refs to light up: the decision's `id` lights the card, `DEC-3.b` one option, a code in `about`, `sources` or the lineage lights that code. |
| `edit()` | Opens the form, for a decision the sandbox has just made. Needs `editable`. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-save` | `{ decision }` | **Propose** or **Accept** in the form. The whole decision as it now stands, with its status and `when` set to the time of the save. Each save is a stage of its own. The card keeps nothing: set `decision` to show it. Accepting needs a chosen option, and asks once when there's no reason. **Cancel** fires nothing. Bubbles. |
| `sb-reopen` | `{ id }` | **Reopen** on an accepted decision. Make a new proposal with a new code, `replaces` set and the options copied, show it on an editable card, and call `edit()`. Bubbles. |
| `sb-go` | `{ ref }` | A code in `about`, `sources` or the lineage is clicked. Go there, or show its trace. Bubbles. |
| `sb-point` | `{ ref }` | Pointing at the card, an option or a code, and `null` on leaving. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-bg`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`.

Classes: `sb-choice` (`--highlighted`), `sb-choice__head`, `sb-choice__heading`, `sb-choice__code`, `sb-choice__title`, `sb-choice__status`, `sb-choice__who`, `sb-choice__lineage`, `sb-choice__gaps`, `sb-choice__gap`, `sb-choice__body`, `sb-choice__label`, `sb-choice__text`, `sb-choice__options`, `sb-choice__option` (`--chosen`, `--highlighted`), `sb-choice__option-head`, `sb-choice__chosen`, `sb-choice__points`, `sb-choice__point` (`--pro`, `--con`), `sb-choice__reason`, `sb-choice__list`, `sb-choice__foot`, `sb-choice__refs`, `sb-choice__ref` (`--highlighted`), `sb-choice__quote`, `sb-choice__actions`, `sb-choice__button` (`--main`, `--quiet`), `sb-choice__message`, `sb-choice__field`, `sb-choice__pick`, `sb-choice__people`, `sb-choice__person`, `sb-choice__empty`.

The card carries `data-ref` with its id, `data-status`, and `data-has-chosen` when an option is chosen. Each option carries `data-ref` as `DEC-3.b`, so a sandbox can find them (see the [locating practice](../../practices/locating.md)). Codes carry `data-go`: they lead to a place rather than being one. Gaps carry `data-tone`: `warn` on an accepted decision, `todo` on a proposal.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[The sources practice](../../practices/sources.md).** On `sb-save`, save the decision as a source file in the workshop's inbox folder, then catalogue it, so model items can cite it and a trace shows the decision behind them.
- **[The identifiers practice](../../practices/identifiers.md).** Issue `DEC-` codes from a counter that only goes up, so a decision has its code at once and can be cited during the workshop.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, so prose can point at a decision or one of its options.
- **[`sb-trace-mode`](../sb-trace-mode/manifest.md) and [`sb-source-trace`](../sb-source-trace/manifest.md).** On `sb-go`, show why the code is there, decisions included.
- **[`sb-id`](../sb-id/manifest.md)** pills in the prose citing a decision's code.

## Notes

- **The card never stores or saves.** Every save comes out as `sb-save` with the whole decision; the sandbox keeps it and sets it back.
- **What's missing is said, not hidden.** An accepted decision without a reason, without deciders, or with options but none chosen shows a warning for each, because a record without them is weaker evidence. A proposal shows what's still to do instead.
- **Readability:** a card is one decision. Keep options to a handful with a few short pros and cons each; for several decisions together, use `compact`.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** status, the chosen option and gaps are in words as well as colour. Codes and actions are buttons; form fields are labelled.
- **Renaming:** if another component on the page is already called `sb-choice`, the console says so. Replace every `sb-choice` in `sb-choice.js` (tag, classes and style id all use it) to give this copy a new name.
