# sb-rule

One rule as a card: a mandate that always applies, a conditional whose demand depends on the situation, or any other shape the sandbox writes. The model says which lines apply now and whether the rule holds; the card shows it, so turning a knob shows a rule switch branch or break. Use it wherever a sandbox has rules worth reading one at a time: flight rules for a rover, limits for a mountain party, the regulations a process must follow.

For a table of many rules with the one about to apply marked, use [`sb-rules`](../sb-rules/manifest.md) instead.

The card knows nothing about the domain, and almost nothing about rule syntax: lines are keywords and text, and the only words it looks for are the modal ones (MUST NOT, MUST, MAY), which a sandbox can replace.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-rule/sb-rule.js"></script>

<sb-rule></sb-rule>

<script>
  const card = document.querySelector('sb-rule');
  card.rule = {
    kind: 'CONDITIONAL', code: 'ROV-R2', title: 'Wheel slip',
    lines: [
      { keyword: 'Given', text: 'the rover is on a drive' },
      { keyword: 'If', text: 'wheel slip is above 60%' },
      { text: 'the drive MUST stop', depth: 1 },
      { keyword: 'Else' },
      { text: 'the rover MAY drive blind', depth: 1 }
    ]
  };

  // On every change to the model:
  const { path, holds } = model.wheelSlipRule();
  card.path = path;                          // e.g. [0, 1, 2]
  card.status = holds ? 'holds' : 'broken';
</script>
```

## Writing rules

Two shapes cover most rules. Use them unless the subject has its own way of stating rules, in which case write that instead: any keywords and indentation work.

**A mandate** states what must, must not or may be, always:

```
MANDATE <code>
  <subject> MUST | MUST NOT | MAY <predicate>
```

```js
{ kind: 'MANDATE', code: 'AV-R1', lines: [{ text: 'everyone MUST carry a transceiver, probe and shovel' }] }
```

**A conditional** says which mandate applies in which situation:

```
CONDITIONAL <code>
  GIVEN <context or starting state>
  IF <condition>
    THEN <mandate>
  ELSE IF <condition>
    THEN <mandate>
  ELSE
    <mandate>
```

Write each `THEN` as its own line one level deeper (`depth: 1`), with or without the `Then` keyword. Keep a rule to one situation and a handful of lines; split a long one into several cards.

## Rule

| Field | Required | Meaning |
|---|---|---|
| `kind` | no | What sort of rule, such as `MANDATE` or `CONDITIONAL`. Shown first, in capitals. |
| `code` | no | The rule's identifying code, shown as a label and used to light up the whole card. |
| `title` | no | What the rule is about, in a few words. |
| `lines` | yes | The lines in order, below. |

Each line:

| Field | Required | Meaning |
|---|---|---|
| `keyword` | no | `Given`, `If`, `Else if`, `Else`, `Then` or anything else. Shown in capitals, in a column of its own. |
| `text` | no | The rest of the line, as plain text. Modal words, quoted text and numbers are marked. |
| `depth` | no | How far to indent the text, in levels. Defaults to `0`. |
| `ref` | no | Identifies the line for `highlight`, and is carried as `data-ref`. |

## Properties

| Member | Meaning |
|---|---|
| `rule` | Get or set the rule. |
| `path` | Indexes of the lines that apply now, worked out by the model: usually the context, the condition met and its mandate. They're marked and the others fade. Empty (the default) shows them all plainly. |
| `status` | `holds`, `broken` or `idle` (not in force), worked out by the model and shown in words. A broken rule's card is outlined in the theme's bad colour. `null` (the default) shows no status. |
| `modals` | The words marked as saying how binding a line is, matched as whole words in capitals as written. Defaults to `['MUST NOT', 'MUST', 'MAY']`; set your own, such as `['SHALL NOT', 'SHALL', 'SHOULD', 'MAY']`. |
| `highlight` | An array of refs to light up: the rule's `code` lights the card, a line's `ref` lights the line. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ rule, line, index }` | A line is clicked, or chosen with Enter or Space. Only reported: the sandbox decides what it means, such as making a clicked condition true. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-bad`, `--sb-radius`.

Classes: `sb-rule` (`--highlighted`), `sb-rule__head`, `sb-rule__kind`, `sb-rule__code`, `sb-rule__title`, `sb-rule__status`, `sb-rule__lines`, `sb-rule__line` (`--highlighted`, `--on-path`, `--off-path`), `sb-rule__keyword`, `sb-rule__text`, `sb-rule__modal`, `sb-rule__value`, `sb-rule__empty`. The card and its status label carry `data-status`. The card carries `data-ref` with its code, and each line with a `ref` carries `data-ref` with it, so a sandbox can find them (see the [locating practice](../../practices/locating.md)).

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **Controls for the model's state,** such as [`sb-parameters`](../sb-parameters/manifest.md). On every change, have the model work out each rule's `path` and `status` and set them, so viewers can push the situation until a rule changes branch or breaks.
- **[`sb-rules`](../sb-rules/manifest.md),** listing every rule in a table, with the one that just fired shown as a card beside it.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, so prose can point at a rule or one of its lines. A phrase that means several lines, such as "the limits", can map to all their refs.
- **[`sb-id`](../sb-id/manifest.md)** pills in the prose citing a rule's code.

## Notes

- **The card never evaluates a rule.** Its text is for people; the model holds the logic and says what applies and whether it holds.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** lines are focusable and chosen with Enter or Space. Status is shown in words as well as colour. Keywords are capitalised by CSS, so screen readers and copying keep the words as written.
- **Renaming:** if another component on the page is already called `sb-rule`, the console says so. Replace every `sb-rule` in `sb-rule.js` (tag, classes and style id all use it) to give this copy a new name.
