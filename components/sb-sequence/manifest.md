# sb-sequence

A sequence diagram: who says what to whom, in what order. Participants stand side by side along the top, each with a lifeline running down, and messages are arrows between the lifelines, in the order they happen. Use it wherever a sandbox has a conversation between parts: ordering food, booking an appointment, a payment going through, two systems talking.

It marks the message happening now and fades the ones still to come, so a sandbox can play the conversation a step at a time. Pointing at a participant lights everything it says and hears; pointing at a message lights who sends and receives it.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-sequence/sb-sequence.js"></script>

<sb-sequence numbered></sb-sequence>

<script>
  const seq = document.querySelector('sb-sequence');
  seq.participants = [{ id: 'you', label: 'You' }, { id: 'cafe', label: 'Café' }];
  seq.messages = [
    { id: 'ask', from: 'you', to: 'cafe', label: 'A flat white, please' },
    { kind: 'note', over: 'cafe', label: 'Makes the coffee' },
    { id: 'give', from: 'cafe', to: 'you', label: 'Here you go', kind: 'reply' }
  ];
  seq.current = 'ask';
</script>
```

## Participants and messages

| Participant field | Required | Meaning |
|---|---|---|
| `id` | yes | Named by messages' `from`, `to` and `over`. |
| `label` | no | Shown in its head. Defaults to `id`. |

Messages are drawn in the order given, one row each.

| Message field | Required | Meaning |
|---|---|---|
| `from`, `to` | yes | Who sends it and who receives it. The same participant twice draws a loop out to the right and back. |
| `label` | no | Shown above the line, with `\n` between lines. |
| `kind` | no | `call` (the default): a solid line, filled arrow. `reply`: dashed, open arrow. `async`, sent without waiting: solid, open arrow. Or `note`, below. |
| `id` | no | Identifies it for `current`, `highlight` and `sb-select`. Defaults to its position in the list, counting from 0. |
| `tone` | no | `good`, `warn` or `bad`, coloured with the theme's status tokens. |

A note is `{ kind: 'note', over, label }`, where `over` is a participant's id, or a list of them to span from the leftmost to the rightmost. Notes take their own row and aren't numbered.

Messages naming a participant that doesn't exist are left out.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `numbered` | off | Numbers the messages 1, 2, 3…, skipping notes. |

## Properties

| Property | Meaning |
|---|---|
| `participants` | Left to right. Setting them redraws the diagram. |
| `messages` | In order. Setting them redraws the diagram. |
| `current` | The id of the message happening now. It's marked, and later messages and notes are faded. `null` shows them all plainly. |
| `highlight` | `{ participants: [ids], messages: [ids] }`: what to point at. A participant lights the messages and notes it takes part in too, and a message (or note) lights its participants. |

Pointing at a participant (its head or lifeline) or a message lights it the same way, while the pointer is there, on top of `highlight`.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ type, id }` | A message or note (`type: 'message'`) or a participant (`type: 'participant'`) is clicked. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Classes: `sb-sequence__svg`, `sb-sequence__participant` (`--highlighted`), `sb-sequence__head`, `sb-sequence__name`, `sb-sequence__lifeline`, `sb-sequence__message` (with its kind, such as `--reply` or `--note`, the tone, `--current`, `--upcoming` and `--highlighted`), `sb-sequence__line`, `sb-sequence__head-filled`, `sb-sequence__head-open`, `sb-sequence__label`, `sb-sequence__number`, `sb-sequence__note-box`, `sb-sequence__note-text`.

Participants, and messages and notes given an `id`, carry `data-ref` with it, so a sandbox can find them (see the [locating practice](../../practices/locating.md)). A message known only by its position has none.

## Notes

- **Layout:** lifelines are spaced to fit the heads and every label between them; a label spanning several lifelines widens each gap evenly.
- **Size:** drawn at its real size, never scaled. It takes the width of its container, and a wider diagram scrolls within it.
- **Not yet:** activation bars and fragments (`alt`, `loop`, `opt`) wait until a sandbox needs them.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-sequence`, the console says so. Replace every `sb-sequence` in `sb-sequence.js` to give this copy a new name.
